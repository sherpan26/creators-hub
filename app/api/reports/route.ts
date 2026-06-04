import {
  listReports,
  insertReport,
  DuplicateReportError,
  type NewReportInput,
} from "@/lib/reports/db";

// Reports are user data that must never be served stale or prerendered.
export const dynamic = "force-dynamic";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ValidationResult =
  | { ok: true; input: NewReportInput }
  | { ok: false; message: string };

function validateBody(body: unknown): ValidationResult {
  if (!isObject(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const { youtubeUrl, source, videoDetails, transcriptAnalysis, transcriptText, geminiFeedback } =
    body;

  if (typeof youtubeUrl !== "string" || youtubeUrl.trim() === "") {
    return { ok: false, message: "youtubeUrl is required." };
  }
  if (source !== "gemini" && source !== "local") {
    return { ok: false, message: 'source must be "gemini" or "local".' };
  }
  if (!isObject(videoDetails)) {
    return { ok: false, message: "videoDetails is required." };
  }
  if (!isObject(transcriptAnalysis)) {
    return { ok: false, message: "transcriptAnalysis is required." };
  }
  if (typeof transcriptText !== "string" || transcriptText.trim() === "") {
    return { ok: false, message: "transcriptText is required." };
  }
  if (geminiFeedback !== undefined && geminiFeedback !== null && !isObject(geminiFeedback)) {
    return { ok: false, message: "geminiFeedback must be an object or null." };
  }

  return {
    ok: true,
    input: {
      youtubeUrl,
      source,
      videoDetails: videoDetails as unknown as NewReportInput["videoDetails"],
      transcriptAnalysis: transcriptAnalysis as unknown as NewReportInput["transcriptAnalysis"],
      transcriptText,
      geminiFeedback: (geminiFeedback ?? null) as unknown as NewReportInput["geminiFeedback"],
    },
  };
}

export async function GET() {
  try {
    const reports = await listReports();
    return Response.json(reports);
  } catch (error) {
    // Log the raw error (may include Supabase details); return a generic body.
    console.error("GET /api/reports failed:", error);
    return Response.json(
      { error: "load_failed", message: "Could not load reports. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return Response.json(
      { error: "invalid_request", message: validation.message },
      { status: 400 },
    );
  }

  try {
    const report = await insertReport(validation.input);
    return Response.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateReportError) {
      return Response.json(
        { error: "duplicate", message: "This report has already been saved." },
        { status: 409 },
      );
    }
    // Log the raw error (may include Supabase details); return a generic body.
    console.error("POST /api/reports failed:", error);
    return Response.json(
      { error: "save_failed", message: "Could not save report. Please try again." },
      { status: 500 },
    );
  }
}
