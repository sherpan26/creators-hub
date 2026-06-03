import type { VideoDetails } from "./youtube";
import type { TranscriptAnalysis } from "./transcript";
import type { GeminiTranscriptFeedback } from "./gemini";

export type SavedReport = {
  id: string;
  createdAt: string;
  youtubeUrl: string;
  source: "gemini" | "local";
  videoDetails: VideoDetails;
  transcriptAnalysis: TranscriptAnalysis;
  geminiFeedback: GeminiTranscriptFeedback | null;
  transcriptText: string; // Added for duplicate checking
};

/**
 * Payload for creating a report. Excludes the DB-generated `id` and
 * `createdAt`. Structurally matches NewReportInput in lib/reports/db.ts (kept
 * here separately because that module is server-only and cannot be imported
 * into client code).
 */
export type NewReportInput = Omit<SavedReport, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Async API client (database-backed via /api/reports).
//
// This is the client layer. It is intended for use from Client Components
// (save/delete flows). Server Components should read through lib/reports/db.ts
// directly instead.
// ---------------------------------------------------------------------------

export type SaveReportResult = {
  success: boolean;
  report?: SavedReport;
  error?: string;
  duplicate?: boolean;
};

const DUPLICATE_MESSAGE = "This report has already been saved.";

async function fetchReports(): Promise<SavedReport[]> {
  const res = await fetch("/api/reports");
  if (!res.ok) {
    throw new Error(`Failed to load reports (${res.status}).`);
  }
  return (await res.json()) as SavedReport[];
}

async function fetchReport(id: string): Promise<SavedReport | null> {
  const res = await fetch(`/api/reports/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load report (${res.status}).`);
  }
  return (await res.json()) as SavedReport;
}

async function postReport(input: NewReportInput): Promise<SaveReportResult> {
  let res: Response;
  try {
    res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }

  if (res.status === 201) {
    const report = (await res.json()) as SavedReport;
    return { success: true, report };
  }

  if (res.status === 409) {
    return { success: false, duplicate: true, error: DUPLICATE_MESSAGE };
  }

  // Try to surface the API's error message, but fall back to a generic one.
  let message = "Could not save report.";
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    message = body.message || body.error || message;
  } catch {
    // ignore body parse failures
  }
  return { success: false, error: message };
}

async function deleteReportRequest(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete report (${res.status}).`);
  }
}

export const reportsApi = {
  getReports: fetchReports,
  getReport: fetchReport,
  saveReport: postReport,
  deleteReport: deleteReportRequest,
};
