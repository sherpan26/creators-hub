import Link from "next/link";
import { VideoUrlForm } from "./video-url-form";
import { ScorecardPreview } from "./scorecard-preview";
import { PlayIcon } from "@/components/ui/icons";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-12 shadow-[0_0_90px_-40px_rgba(34,211,238,0.65)] sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_42%),radial-gradient(circle_at_85%_12%,rgba(34,211,238,0.18),transparent_42%)]" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
            <PlayIcon className="h-3 w-3" />
            Creator scorecards
          </p>

          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Score your next upload before you post.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Find the weak point in your hook, pacing, packaging, and SEO — with a
            creator scorecard built from your video and transcript, not generic
            growth advice.
          </p>

          <VideoUrlForm />

          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Start with a YouTube URL. You&apos;ll paste the transcript next to
            generate the full scorecard.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>Real YouTube data + AI-assisted feedback</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:inline-block" />
            <Link href="/reports" className="font-semibold text-cyan-200 hover:text-cyan-100">
              View saved reports
            </Link>
          </div>
        </div>

        <div className="lg:pl-4">
          <ScorecardPreview />
        </div>
      </div>
    </section>
  );
}
