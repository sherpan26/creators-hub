import { notFound } from "next/navigation";
import { getReportById } from "@/lib/reports/db";
import type { SavedReport } from "@/lib/reports";
import { ReportDetail } from "@/components/reports/report-detail";
import { ErrorState } from "@/components/reports/error-state";

// Always read the latest report from the database (e.g. right after saving).
export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // A DB/server failure must render a friendly panel. A successful query that
  // returns no row (report === null) is a genuine 404 and keeps notFound().
  let report: SavedReport | null;
  try {
    report = await getReportById(id);
  } catch (error) {
    console.error(`GET /reports/${id}: failed to load report:`, error);
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.95))]" />
        <div className="relative mx-auto max-w-6xl">
          <ErrorState
            title="Could not load report"
            message="Could not load this report. Please try again."
            backHref="/reports"
            backLabel="Back to Reports"
          />
        </div>
      </main>
    );
  }

  if (!report) {
    notFound();
  }

  return <ReportDetail report={report} />;
}
