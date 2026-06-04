import Link from "next/link";
import type { SavedReport } from "@/lib/reports";
import { TranscriptFeedback } from "@/components/dashboard/transcript-feedback";
import { VideoDetails } from "@/components/dashboard/video-details";
import { Scorecard } from "@/components/reports/scorecard";

type ReportDetailProps = {
  report: SavedReport;
};

export function ReportDetail({ report }: ReportDetailProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.95))]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Saved Report
          </h1>
          <Link
            href="/reports"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to Reports
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Saved on {new Date(report.createdAt).toLocaleString()}
        </p>

        <div className="mt-8">
          <Scorecard scorecard={report.scorecard} />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <TranscriptFeedback
              analysis={report.transcriptAnalysis}
              aiFeedback={report.geminiFeedback}
              source={report.source}
            />
          </div>
          <div className="space-y-4">
            <VideoDetails
              details={report.videoDetails}
              inputVideoUrl={report.youtubeUrl}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
