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
// This is the new client layer. It is intended for use from Client Components
// (save/delete flows). Server Components should read through lib/reports/db.ts
// directly instead. Consumers are migrated to `reportsApi` in Step 4.
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

// ===========================================================================
// LEGACY localStorage implementation — DEPRECATED.
//
// Preserved only so existing UI consumers (app/reports/page.tsx,
// components/reports/report-detail.tsx, components/dashboard/transcript-input.tsx)
// keep compiling until they are migrated to `reportsApi` in Step 4. Do not use
// `reportsService` in new code. This entire block is removed once consumers no
// longer reference it.
// ===========================================================================

const REPORTS_STORAGE_KEY = "creators-hub:saved-reports";

// --- External store wiring (for useSyncExternalStore) ---
// Lets client components read localStorage without a hydration mismatch or a
// setState-in-effect, and re-render automatically when reports change.
const EMPTY_REPORTS: SavedReport[] = [];
const listeners = new Set<() => void>();
let snapshotCache: SavedReport[] | null = null;

function notifyReportsChanged() {
  snapshotCache = null; // invalidate so the next snapshot is recomputed
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Must return a referentially stable value when nothing changed, otherwise
// useSyncExternalStore would loop. The cache provides that stability.
function getReportsSnapshot(): SavedReport[] {
  if (typeof window === "undefined") return EMPTY_REPORTS;
  if (snapshotCache === null) {
    snapshotCache = getReports();
  }
  return snapshotCache;
}

function getServerReportsSnapshot(): SavedReport[] {
  return EMPTY_REPORTS;
}

function getReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const reports = JSON.parse(raw) as SavedReport[];
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Failed to retrieve reports from localStorage:", error);
    return [];
  }
}

function saveReport(report: SavedReport): {
  success: boolean;
  report?: SavedReport;
  error?: string;
} {
  if (typeof window === "undefined") {
    return { success: false, error: "localStorage is not available." };
  }
  try {
    const reports = getReports();

    const isDuplicate = reports.some(
      (r) =>
        r.youtubeUrl === report.youtubeUrl &&
        r.transcriptText === report.transcriptText
    );

    if (isDuplicate) {
      return { success: false, error: "This report has already been saved." };
    }

    reports.unshift(report);
    window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    notifyReportsChanged();
    return { success: true, report };
  } catch (error) {
    console.error("Failed to save report to localStorage:", error);
    return {
      success: false,
      error: "Could not save report. Storage might be full.",
    };
  }
}

function deleteReport(id: string): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    let reports = getReports();
    reports = reports.filter((r) => r.id !== id);
    window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    notifyReportsChanged();
    return reports;
  } catch (error) {
    console.error("Failed to delete report from localStorage:", error);
    return getReports(); // Return original list on failure
  }
}

function getReport(id: string): SavedReport | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return getReports().find((r) => r.id === id);
  } catch (error) {
    console.error("Failed to get report by ID from localStorage:", error);
    return undefined;
  }
}

/** @deprecated legacy localStorage service; use `reportsApi` instead. */
export const reportsService = {
  getReports,
  saveReport,
  deleteReport,
  getReport,
  subscribe,
  getReportsSnapshot,
  getServerReportsSnapshot,
};
