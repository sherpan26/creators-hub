-- Migration: create saved_reports
-- Phase 0 of the backend plan (see docs/backend-plan.md).
--
-- This table replaces the current localStorage report store. It mirrors the
-- SavedReport shape in lib/reports.ts. The three nested objects are stored as
-- JSONB so the schema does not churn if the Gemini/analysis output evolves.
--
-- RLS is intentionally NOT enabled in this migration: auth has not been added
-- yet (Phase 2). Until then, reports are written server-side with the
-- service-role key. Do not expose this table to the anon/public client until
-- RLS policies exist.

create table saved_reports (
  id uuid primary key default gen_random_uuid(),

  -- NULLABLE DURING PHASE 1.
  -- There are no users yet, so reports are saved with user_id = null and the
  -- app behaves as a single user. In Phase 2 this column becomes a foreign key
  -- to auth.users(id) (on delete cascade) and RLS will scope rows by
  -- auth.uid() = user_id.
  user_id uuid,

  youtube_url text not null,

  -- Extracted YouTube video id (via extractVideoId()). Nullable because older
  -- or malformed inputs may not yield one. Used for indexing / lookups.
  video_id text,

  -- Only the two values the app produces today.
  source text not null check (source in ('gemini', 'local')),

  -- Nested objects from the app, stored as JSONB:
  --   video_details:       { title, channelName, views, uploadDate,
  --                          thumbnailUrl?, description?, likeCount?, commentCount? }
  --   transcript_analysis: TranscriptAnalysis (wordCount, speakingSeconds,
  --                          hookSnippet, suggestions[], ...)
  --   gemini_feedback:     GeminiTranscriptFeedback, or null when Gemini failed
  --                          and the report fell back to local analysis.
  video_details jsonb not null,
  transcript_analysis jsonb not null,
  gemini_feedback jsonb,

  transcript_text text not null,

  -- Stored hash of the transcript, used by the duplicate constraint below so we
  -- do not have to index the full transcript text.
  transcript_hash text generated always as (md5(transcript_text)) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for per-user listing and per-user/video lookups (Phase 2 onward).
-- While user_id is null in Phase 1 these still index correctly; they become
-- meaningful once rows carry a real user_id.
create index idx_saved_reports_user on saved_reports (user_id);
create index idx_saved_reports_user_video on saved_reports (user_id, video_id);

-- Duplicate detection, mirroring the current app rule:
-- "same submitted URL + same transcript text = duplicate".
--
-- NULLS NOT DISTINCT (Postgres 15+, which Supabase uses) makes the constraint
-- treat null user_ids as equal, so duplicates are still rejected during Phase 1
-- when every row has user_id = null. Once real user_ids exist, dedupe is scoped
-- per user automatically.
alter table saved_reports
  add constraint uq_saved_reports_user_url_transcript
  unique nulls not distinct (user_id, youtube_url, transcript_hash);
