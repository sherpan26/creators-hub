import { getReportById, deleteReportById } from "@/lib/reports/db";

// Reports are user data that must never be served stale or prerendered.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const report = await getReportById(id);
    if (!report) {
      return Response.json(
        { error: "not_found", message: "Report not found." },
        { status: 404 },
      );
    }
    return Response.json(report);
  } catch (error) {
    console.error(`GET /api/reports/${id} failed:`, error);
    return Response.json(
      { error: "load_failed", message: "Could not load report. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Confirm existence first so a missing report returns 404 rather than a
    // silent success (deleteReportById is a no-op when the row is absent).
    const existing = await getReportById(id);
    if (!existing) {
      return Response.json(
        { error: "not_found", message: "Report not found." },
        { status: 404 },
      );
    }

    await deleteReportById(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/reports/${id} failed:`, error);
    return Response.json(
      { error: "delete_failed", message: "Could not delete report. Please try again." },
      { status: 500 },
    );
  }
}
