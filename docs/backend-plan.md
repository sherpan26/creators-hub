# Creator's Hub — Backend Phase Plan

> Status: **planning only**. No backend implemented yet. No SQL, packages, or
> app changes have been made. This document is the design we'll build against
> when moving saved reports off localStorage and onto a real database.

## Goal

Move saved reports from `localStorage` into a real backend/database so that
reports can later belong to logged-in users, without rewriting the app twice.

---

## Recommended stack: Supabase Auth + Supabase Postgres

For a beginner-friendly solo project migrating off localStorage, Supabase is the
lowest-friction path: one platform provides Postgres, auth, row-level security
(RLS), OAuth, and a data dashboard, with a generous free tier and first-class
Next.js App Router support via `@supabase/ssr`.

### Why this fits Creator's Hub

- **One service, not two.** Clerk+Supabase or Auth.js+Prisma split auth and
  database across providers, adding identity-bridging work (e.g. mapping Clerk
  user IDs into Supabase rows). With Supabase, `auth.users` and our reports live
  in the same database, so `user_id` is a plain foreign key.
- **RLS replaces a hand-written authorization layer.** "Reports belong to the
  logged-in user" becomes a one-line policy (`auth.uid() = user_id`) instead of
  per-route ownership checks scattered everywhere. This is the biggest beginner
  win.
- **It can be phased.** We want database first, users later. Supabase lets us
  write to Postgres from existing server routes (service-role key) now, then add
  Auth + RLS on top — no re-architecture.
- **It matches what we already built.** We already have server-side API routes
  for YouTube/Gemini using private env keys. A server-side Supabase client
  follows the exact same pattern — no new mental model.
- **Future features line up.** Stripe plan tier, Discord linking, and mentor
  reviews all become columns/tables in a DB we already own.

### Why not the alternatives (for now)

- **Clerk + Supabase Postgres** — Clerk's auth DX is excellent (prebuilt UI
  components), but it means two dashboards, two free tiers, and the
  Clerk↔Supabase JWT-template integration required for RLS to see Clerk's user
  ID. That integration is a common quiet breakage for beginners. Revisit if we
  outgrow Supabase Auth's UI.
- **Auth.js (NextAuth) + Prisma + Postgres** — Most control and no auth-vendor
  lock-in, and Prisma's typed migrations are great. But it's the most pieces to
  assemble: Auth.js v5 callbacks/adapters in App Router, separately-hosted
  Postgres, session-strategy decisions, and more glue code. Higher ceiling,
  steeper start.

---

## `saved_reports` schema

Mirrors the current `SavedReport` shape in `lib/reports.ts`. The three nested
objects are stored as **JSONB**: they are already nested TypeScript objects, we
rarely query inside them, and JSONB avoids migration churn if Gemini's output
evolves. Fields can be promoted to real columns later if we need to
filter/sort on them.

| Column                | Type          | Notes |
| --------------------- | ------------- | ----- |
| `id`                  | uuid (pk)     | DB-generated. Replaces client-side `crypto.randomUUID()`; the insert returns the new id. |
| `user_id`             | uuid (null)   | Nullable in Phase 1. Becomes a foreign key to `auth.users(id)` (cascade delete) in Phase 2. |
| `youtube_url`         | text          | Not null. The submitted URL. |
| `video_id`            | text (null)   | Extracted via `extractVideoId()`. Handy for indexing/dedupe. |
| `source`              | text          | `'gemini'` or `'local'`. |
| `video_details`       | jsonb         | `{ title, channelName, views, uploadDate, thumbnailUrl?, description?, likeCount?, commentCount? }` |
| `transcript_analysis` | jsonb         | `TranscriptAnalysis` (wordCount, speakingSeconds, hookSnippet, suggestions[], …). |
| `gemini_feedback`     | jsonb (null)  | `GeminiTranscriptFeedback` or null. |
| `transcript_text`     | text          | The raw transcript. |
| `transcript_hash`     | text          | Generated hash of `transcript_text`, used for duplicate detection. |
| `created_at`          | timestamptz   | Defaults to now(). Replaces the current ISO string. |
| `updated_at`          | timestamptz   | Defaults to now(). |

**Indexes / constraints**

- Index on `user_id`.
- Composite index on `(user_id, video_id)`.
- **Unique** on `(user_id, youtube_url, transcript_hash)` — reproduces the
  current "same URL + same transcript = duplicate" rule at the data layer. A
  unique violation maps to the existing `"already been saved"` → `"duplicate"`
  UI state.

**RLS (Phase 2)** — enable row-level security; owner-only policy:
read/write allowed where `auth.uid() = user_id`.

---

## Future `profiles` schema

App-specific user data, kept separate from Supabase-managed auth identity. This
is reserved for later (auth phase) and is **not** part of the first build.

| Column                | Type          | Notes |
| --------------------- | ------------- | ----- |
| `id`                  | uuid (pk)     | Foreign key to `auth.users(id)` (cascade delete). |
| `email`               | text          | |
| `display_name`        | text          | |
| `avatar_url`          | text          | |
| `youtube_channel_url` | text (null)   | Future. |
| `plan`                | text          | Defaults to `'free'`. Future Stripe tiers (`'free'`/`'pro'`/…). |
| `created_at`          | timestamptz   | Defaults to now(). |
| `updated_at`          | timestamptz   | Defaults to now(). |

- A trigger auto-creates a matching `profiles` row when a new `auth.users` row
  is inserted.
- RLS: a user can read and update only their own profile row
  (`auth.uid() = id`).

---

## Migration plan: localStorage → database

**Phase 0 — Setup (no app behavior change)**

1. Create a Supabase project; obtain the Project URL, anon key, and service-role
   key.
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   and `SUPABASE_SERVICE_ROLE_KEY` (server-only — **never** `NEXT_PUBLIC_`).
3. Add the `@supabase/supabase-js` and `@supabase/ssr` packages.
4. Create the `saved_reports` schema. Keep RLS off or permissive for now;
   `user_id` nullable.

**Phase 1 — DB-backed reports, still single-user (no auth yet)**

5. Add server-side Supabase client helpers.
6. Build CRUD API routes: `GET/POST /api/reports`, `GET/DELETE /api/reports/[id]`,
   using the service-role client. Insert with `user_id = null` for now. Return
   `409` on duplicate.
7. Rewrite `lib/reports.ts` from a synchronous localStorage service into an
   **async** API client with the same method names, plus a DB-row →
   `SavedReport` mapper.
8. Update components to handle async (loading/error states). Verify end-to-end
   persistence against the DB while still effectively single-user.

**Phase 2 — Add Supabase Auth + ownership**

9. Add login UI (Google OAuth + email magic link), an `app/auth/callback` route,
   and `middleware.ts` for session refresh (`@supabase/ssr`).
10. Add the `profiles` table + new-user trigger.
11. Switch report queries from the service-role client to the **user-scoped**
    client (anon key + cookies). Set `user_id` from the session on insert. Turn
    **on RLS**. Reports become private per user automatically.

**Phase 3 — One-time import of existing localStorage reports (optional)**

12. On first authenticated load, detect any localStorage reports, offer to
    import them (POST to `/api/reports`), then clear localStorage.

**Phase 4 — Cleanup**

13. Remove all localStorage code paths and the `useSyncExternalStore` store from
    `lib/reports.ts`.

### Files expected to change

**New**

- `lib/supabase/server.ts`, `lib/supabase/client.ts` — Supabase clients.
- `app/api/reports/route.ts` (GET list, POST create),
  `app/api/reports/[id]/route.ts` (GET one, DELETE).
- Database migration for schema, indexes, RLS, and trigger.
- `middleware.ts` — auth session refresh (Phase 2).
- `app/login/…`, `app/auth/callback/route.ts`, auth UI components (Phase 2).
- `.env.example` — document required vars.

**Changed**

- `lib/reports.ts` — localStorage → async API client + DB-row mapper (biggest
  change).
- `app/reports/page.tsx` — fetch from server; drop `useSyncExternalStore`.
- `components/reports/report-detail.tsx` — fetch single report by id; remove the
  `isClient`/store gate.
- `components/reports/report-card.tsx` — `onDelete` calls the async API.
- `components/dashboard/transcript-input.tsx` — `handleSaveReport` becomes an
  async API call; duplicate handled via `409`; redirect uses the
  server-returned id.
- `.env.local`, `package.json` — new vars and deps.

The YouTube/Gemini routes and `dashboard-report.tsx` are largely untouched.

---

## Risks / gotchas

- **Sync → async refactor is the real work.** localStorage was synchronous; the
  DB is not. Every read/write needs loading and error states, and the current
  `useSyncExternalStore` pattern goes away. Most bugs will appear here, not in
  the schema.
- **Service-role key safety.** It bypasses RLS and grants full DB access —
  server routes only, never shipped to the client, never `NEXT_PUBLIC_`. Treat
  it like the YouTube/Gemini keys.
- **RLS footguns.** With RLS on, the service-role client bypasses it (correct for
  admin/server tasks, wrong for per-user reads). Use the user-scoped (cookie)
  client for user actions, and actually test that user A cannot read user B's
  reports.
- **ID source change.** Moving id generation to the DB means the save flow must
  redirect using the returned id, not a client-generated UUID.
- **Duplicate mapping.** Enforce dedupe with the unique constraint and translate
  the unique-violation into the existing "duplicate" UI; don't reimplement the
  check in two places.
- **JSONB schema drift.** Old rows keep their old shape if
  `GeminiTranscriptFeedback` changes. The existing `safeParseFeedback` tolerance
  helps; consider a `schema_version` field if shapes churn.
- **Next.js data freshness.** Ensure report reads aren't served stale (route
  handlers aren't cached by default; mark server components dynamic / `no-store`
  if used).
- **OAuth redirect config.** Google + Supabase redirect URLs must be set for both
  localhost and prod, or login silently fails.
- **Free-tier pause + data loss.** Supabase free projects pause after ~1 week
  idle (just resume). Users lose existing localStorage reports unless we ship the
  Phase 3 import — decide if that matters for the MVP.
- **Rotate the existing API keys.** The real YouTube/Gemini keys currently in
  `.env.local` should be rotated before any deploy — unrelated to this migration
  but worth doing in the same pass.

---

## What to implement first

Do **persistence before auth** — it de-risks the hard part (the async refactor)
without piling on auth complexity:

1. **Supabase project + `saved_reports` schema** (JSONB columns, RLS off for
   now).
2. **Server CRUD API routes** for reports using the service-role client.
3. **Refactor `lib/reports.ts` to the async API + update the
   reports/detail/save components** to handle async. Confirm full end-to-end
   persistence works as "single user."
4. **Only then add Auth** (Supabase Auth + `profiles` + `user_id` + RLS), and
   finally the optional localStorage import.

Get steps 1–3 working and stable first. Auth in step 4 then mostly adds a
`user_id` and flips RLS on, rather than forcing a second big rewrite.
