import Link from "next/link";
import { listReports } from "@/lib/reports/db";
import type { SavedReport } from "@/lib/reports";
import { ReportsList } from "@/components/reports/reports-list";
import { EmptyState } from "@/components/reports/empty-state";
import { ErrorState } from "@/components/reports/error-state";
import { BookmarkIcon, PlayIcon } from "@/components/ui/icons";

// Always reflect the latest saved/deleted reports.
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // A DB/server failure here must show a friendly panel, not crash the route.
  // null distinguishes "load failed" from "loaded but empty" (an empty array).
  let reports: SavedReport[] | null = null;
  try {
    reports = await listReports();
  } catch (error) {
    console.error("GET /reports: failed to list reports:", error);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.95))]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              <BookmarkIcon className="h-3.5 w-3.5" />
              Creator analytics
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Saved Reports
            </h1>
            {reports ? (
              <p className="mt-2 text-sm text-slate-400">
                You have {reports.length} saved report
                {reports.length !== 1 ? "s" : ""}.
              </p>
            ) : null}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            <PlayIcon className="h-4 w-4" />
            Analyze a Video
          </Link>
        </div>

        {reports === null ? (
          <ErrorState
            title="Could not load reports"
            message="Could not load saved reports. Please try again."
          />
        ) : reports.length > 0 ? (
          <ReportsList reports={reports} />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}
