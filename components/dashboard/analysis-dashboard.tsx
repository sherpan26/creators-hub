"use client";

import { useState } from "react";
import Link from "next/link";
import type { YouTubeDetails } from "@/lib/youtube";
import { VideoDetails } from "./video-details";
import { TranscriptInput } from "./transcript-input";

type AnalysisDashboardProps = {
  inputVideoUrl?: string;
};

/**
 * Honest analysis flow: show the real YouTube metadata first, then the required
 * transcript input. The full Creator Scorecard is generated server-side on save
 * and shown on /reports/[id] — never faked here before analysis exists.
 */
export function AnalysisDashboard({ inputVideoUrl }: AnalysisDashboardProps) {
  // The live YouTube metadata resolves inside <VideoDetails>; lift it up so the
  // save flow uses the real details (no mock fallback). Null until it resolves.
  const [resolvedDetails, setResolvedDetails] = useState<YouTubeDetails | null>(null);

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          Analyze a Video
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Analyze your video
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          We fetch your video&apos;s details from YouTube below. Paste the transcript
          to run the analysis — the full Creator Scorecard is generated from your
          metadata, transcript, and AI/local feedback, then saved to your reports.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Analyze another video
          </Link>
          <Link
            href="/reports"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            View saved reports
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-4">
          <VideoDetails
            inputVideoUrl={inputVideoUrl}
            onDetailsResolved={setResolvedDetails}
          />
        </div>

        <div className="space-y-4">
          <TranscriptInput
            videoDetails={resolvedDetails ?? undefined}
            youtubeUrl={inputVideoUrl || ""}
          />

          <section className="rounded-3xl border border-dashed border-white/15 bg-slate-900/50 p-6">
            <h3 className="text-xl font-semibold text-white">Creator Scorecard</h3>
            <p className="mt-3 text-sm text-slate-400">
              Creator Scorecard will be generated after transcript analysis and
              saving. Once you save, it opens on the report page.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
