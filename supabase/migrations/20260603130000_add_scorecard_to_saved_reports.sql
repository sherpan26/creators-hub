-- Migration: add creator scorecard columns to saved_reports
-- Phase C1 of the scorecard integration (see docs/scoring-plan.md "Phase C/E").
--
-- This migration is ADDITIVE and NULLABLE only. It adds storage for the
-- deterministic creator scorecard (computed by lib/scoring.ts) without touching
-- existing columns, data, or behavior. No backfill is performed.
--
-- RLS is still intentionally NOT enabled (auth has not been added yet). Reports
-- continue to be written server-side with the service-role key.

alter table saved_reports
  -- Full CreatorScorecard snapshot (overall + per-category breakdown, signals,
  -- strengths/weaknesses/topFixes). Stored as JSONB so the shape can evolve
  -- without migration churn.
  --
  -- NULLABLE: reports created before this migration have no scorecard. The app
  -- treats a null scorecard as "stored-first, recompute on the fly" — it can
  -- rebuild the scorecard at read time from the already-persisted inputs
  -- (video_details, transcript_analysis, gemini_feedback, transcript_text).
  -- New reports will compute the scorecard SERVER-SIDE at save time and store it
  -- here, so the value is authoritative and tamper-resistant.
  add column scorecard jsonb,

  -- Denormalized copy of scorecard.overallScore (0-100), kept as a real column
  -- so we can sort/filter reports by score cheaply without unpacking JSONB.
  -- Derived server-side from the computed scorecard; nullable for old rows.
  add column overall_score integer,

  -- Denormalized copy of scorecard.scoreVersion (e.g. "1.0.0"). Lets us identify
  -- which scoring-algorithm version produced a stored scorecard so future
  -- algorithm changes can target specific rows for an optional backfill.
  add column score_version text;

-- Guard the denormalized score: either absent (old/unscored rows) or in range.
alter table saved_reports
  add constraint chk_overall_score_range
  check (overall_score is null or (overall_score between 0 and 100));

-- Supports future "best reports first" sorting/filtering. NULLS LAST keeps
-- unscored (old) rows out of the way when ordering by score descending.
create index idx_saved_reports_overall_score
  on saved_reports (overall_score desc nulls last);
