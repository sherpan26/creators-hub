# Creator's Hub

A full-stack web app that gives small YouTube creators an **AI-assisted, deterministic scorecard** for a video — before they post. Paste a YouTube URL and a transcript, and Creator's Hub returns an honest, explainable breakdown of the video's hook, pacing, packaging, SEO, engagement, and clarity, then saves it as a report you can revisit.

## The problem it solves

Most "grow your channel" advice is generic and unactionable. Creators rarely know *which* part of a specific video is holding it back. Creator's Hub analyzes one real video and returns targeted, prioritized feedback — a per-category scorecard with concrete fixes — so the next upload is measurably stronger. Scores are grounded in **deterministic heuristics** (not "AI vibes"), with AI used only as a bounded supporting signal.

## Key features

- **YouTube metadata analysis** — fetches title, channel, views, likes, comments, and thumbnail via the YouTube Data API.
- **Transcript-based feedback** — analyzes a pasted transcript for hook strength, pacing, filler, structure, and clarity.
- **Creator Scorecard** — an overall score plus six weighted categories (Hook, Pacing/Structure, Packaging, SEO, Engagement, Clarity) with strengths, weaknesses, and top fixes.
- **Deterministic scoring engine** — a pure, versioned, auditable scorer; every score lists the signals that produced it. Anti-gaming by design (engagement normalized by views, fair to small/new videos, no fabricated thumbnail-image scoring).
- **Gemini-assisted analysis with local fallback** — Gemini enriches the feedback when available; if it fails, the app falls back to local analysis and still produces a complete scorecard. AI influence on scores is bounded so it can nudge but never hijack the deterministic baseline.
- **Supabase saved reports** — reports persist to Postgres; scorecards are computed server-side at save time and stored as a reproducible snapshot.
- **Creator-studio dashboard UI** — a dark, video-analytics-inspired interface: score rings, category bars, an analysis pipeline view, and analytics-style report cards.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Supabase / Postgres** (`@supabase/supabase-js`) for persistence
- **Google Gemini API** for AI-assisted transcript feedback
- **YouTube Data API** for video metadata
- **Tailwind CSS** for the UI

## Architecture overview

```
Browser (React client components)
   │  paste URL / transcript, view scorecards
   ▼
Next.js App Router
   ├── UI ............ app/, components/ (landing, dashboard, reports, ui)
   ├── API routes .... app/api/youtube  → YouTube Data API (metadata)
   │                   app/api/gemini   → Gemini API (transcript feedback)
   │                   app/api/reports  → CRUD for saved reports
   ├── Scoring engine  lib/scoring.ts (pure, deterministic + bounded AI blend)
   └── Persistence ... lib/reports/db.ts → Supabase (saved_reports table)
```

- **Frontend UI** — App Router pages (`/`, `/dashboard`, `/reports`, `/reports/[id]`) with reusable components under `components/`.
- **API routes** — server-side handlers proxy the YouTube and Gemini APIs (keys stay on the server) and expose report CRUD.
- **Scoring engine** — `lib/scoring.ts` is a pure, isomorphic module; the scorecard is computed **server-side** in the report-save path so the stored value is authoritative.
- **Supabase persistence** — `lib/reports/db.ts` maps the `saved_reports` table to the app's types and persists the scorecard alongside the report inputs.

## Environment variables

Create `.env.local` in the project root (this file is gitignored — never commit real values). See `.env.example` for the template.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Server only | YouTube Data API access |
| `GEMINI_API_KEY` | Server only | Google Gemini API access |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Server-side DB writes — bypasses RLS; never expose to the client |

## Local setup

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:3000)
npm run lint    # run ESLint
npm run build   # production build / type-check
```

## Database

Schema is managed as SQL migrations in [`supabase/migrations/`](supabase/migrations):

- `…_create_saved_reports.sql` — the `saved_reports` table (JSONB columns for video details, transcript analysis, and Gemini feedback; duplicate-detection constraint).
- `…_add_scorecard_to_saved_reports.sql` — adds `scorecard` (JSONB), `overall_score`, and `score_version`.

Apply migrations to your Supabase project (e.g. via the Supabase SQL Editor) before saving reports. Migrations are additive and nullable, so existing rows remain valid.

## Known limitations

- **No authentication yet** — Supabase Auth/RLS are not enabled.
- **Reports are single-user / global** — rows are saved with `user_id = null`; there is no per-user scoping yet.
- **Transcripts are pasted manually** — there is no automatic transcript extraction.
- **Thumbnails are not visually analyzed** — packaging is scored from the title/metadata; the thumbnail image itself isn't inspected.

## Roadmap

- Supabase **Auth + Row Level Security** (per-user reports)
- **Automatic transcript extraction** (remove the manual paste step)
- **Score explainability** improvements (clearer per-signal reasoning)
- **Channel-level analytics** across multiple uploads
- **Deploy to Vercel**
