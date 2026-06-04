"use client";

import { useState } from "react";
import Link from "next/link";
import { AIFeedback } from "@/components/dashboard/ai-feedback";
import { ScoreGrid } from "@/components/dashboard/score-grid";
import { TopFixes } from "@/components/dashboard/top-fixes";
import { VideoDetails } from "@/components/dashboard/video-details";
import { TranscriptInput } from "@/components/dashboard/transcript-input";
import type { AnalysisReport } from "@/lib/mock/dashboard";
import type { YouTubeDetails } from "@/lib/youtube";

type DashboardReportProps = {
  report: AnalysisReport;
  inputVideoUrl?: string;
};

export function DashboardReport({ report, inputVideoUrl }: DashboardReportProps) {
  // The real YouTube metadata is fetched inside <VideoDetails>. Lift the
  // resolved result up here so the save flow uses the actual video details
  // instead of the mock fallback. Stays null until the fetch succeeds.
  const [resolvedDetails, setResolvedDetails] = useState<YouTubeDetails | null>(null);

  // Only fall back to mock data when the live fetch hasn't produced details.
  const effectiveDetails = resolvedDetails ?? report.videoDetails;

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          Analysis Result
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Your Creator Scorecard
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          This is a mock MVP report showing how Creator&apos;s Hub can score video
          quality and suggest the highest-impact changes.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Analyze another video
          </Link>
        </div>
      </div>

      <ScoreGrid scores={report.scores} />

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <TopFixes fixes={report.topFixes} />
          <div>
            <TranscriptInput
              videoDetails={effectiveDetails}
              youtubeUrl={inputVideoUrl || ""}
            />
          </div>
        </div>

        <div className="space-y-4">
          <VideoDetails
            details={report.videoDetails}
            inputVideoUrl={inputVideoUrl}
            onDetailsResolved={setResolvedDetails}
          />
        </div>
      </section>

      <section className="mt-4">
        <AIFeedback feedback={report.aiFeedback} />
      </section>
    </>
  );
}
