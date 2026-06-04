import "server-only";

import { extractVideoId, type VideoDetails } from "../youtube";
import type { TranscriptAnalysis } from "../transcript";
import type { GeminiTranscriptFeedback } from "../gemini";
import { computeScorecard, type CreatorScorecard, type ScorecardInput } from "../scoring";
import type { SavedReport } from "../reports";
import { getSupabaseServiceClient } from "../supabase/server";

const TABLE = "saved_reports";

// Postgres unique_violation. Raised by the uq_saved_reports_user_url_transcript
// constraint when the same URL + transcript is saved again.
const UNIQUE_VIOLATION = "23505";

/**
 * Payload accepted when creating a report. Excludes DB-generated fields (the
 * database assigns `id` and `created_at`) and the server-generated `scorecard`
 * (computed at save time in a later phase, never supplied by the caller).
 */
export type NewReportInput = Omit<SavedReport, "id" | "createdAt" | "scorecard">;

/**
 * Thrown by insertReport when the report duplicates an existing one. Callers
 * (API routes, later) translate this into an HTTP 409.
 */
export class DuplicateReportError extends Error {
  constructor(message = "This report has already been saved.") {
    super(message);
    this.name = "DuplicateReportError";
  }
}

// Shape of a row in the saved_reports table (snake_case, jsonb columns).
type SavedReportRow = {
  id: string;
  user_id: string | null;
  youtube_url: string;
  video_id: string | null;
  source: "gemini" | "local";
  video_details: VideoDetails;
  transcript_analysis: TranscriptAnalysis;
  gemini_feedback: GeminiTranscriptFeedback | null;
  transcript_text: string;
  transcript_hash: string;
  // Scorecard columns (added in migration 20260603130000). Null for rows saved
  // before scorecards existed; not yet written by the app (Phase C3).
  scorecard: CreatorScorecard | null;
  overall_score: number | null;
  score_version: string | null;
  created_at: string;
  updated_at: string;
};

/** Maps a DB row (snake_case) to the app's SavedReport (camelCase). */
export function rowToSavedReport(row: SavedReportRow): SavedReport {
  return {
    id: row.id,
    createdAt: row.created_at,
    youtubeUrl: row.youtube_url,
    source: row.source,
    videoDetails: row.video_details,
    transcriptAnalysis: row.transcript_analysis,
    geminiFeedback: row.gemini_feedback,
    transcriptText: row.transcript_text,
    // Null-safe: old rows (and any partial select) map to a null scorecard.
    scorecard: row.scorecard ?? null,
  };
}

/** Returns all saved reports, newest first. */
export async function listReports(): Promise<SavedReport[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list reports: ${error.message}`);
  }

  return (data as SavedReportRow[]).map(rowToSavedReport);
}

/** Returns a single report by id, or null if it does not exist. */
export async function getReportById(id: string): Promise<SavedReport | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load report: ${error.message}`);
  }

  return data ? rowToSavedReport(data as SavedReportRow) : null;
}

/**
 * Inserts a new report and returns it (with DB-generated id/createdAt).
 * Throws DuplicateReportError if it violates the uniqueness constraint.
 *
 * The scorecard is computed SERVER-SIDE here from the report's own inputs — it
 * is never accepted from the client — so the stored value is authoritative and
 * tamper-resistant. overall_score / score_version are denormalized from it.
 *
 * Phase 1: user_id is left null. transcript_hash is a generated column, so it
 * is not set here.
 */
export async function insertReport(input: NewReportInput): Promise<SavedReport> {
  const supabase = getSupabaseServiceClient();

  const scorecardInput: ScorecardInput = {
    youtubeUrl: input.youtubeUrl,
    videoDetails: input.videoDetails,
    transcriptAnalysis: input.transcriptAnalysis,
    transcriptText: input.transcriptText,
    geminiFeedback: input.geminiFeedback,
  };
  const scorecard = computeScorecard(scorecardInput);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      youtube_url: input.youtubeUrl,
      video_id: extractVideoId(input.youtubeUrl),
      source: input.source,
      video_details: input.videoDetails,
      transcript_analysis: input.transcriptAnalysis,
      gemini_feedback: input.geminiFeedback,
      transcript_text: input.transcriptText,
      scorecard,
      overall_score: scorecard.overallScore,
      score_version: scorecard.scoreVersion,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new DuplicateReportError();
    }
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return rowToSavedReport(data as SavedReportRow);
}

/** Deletes a report by id. No-op if it does not exist. */
export async function deleteReportById(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete report: ${error.message}`);
  }
}
