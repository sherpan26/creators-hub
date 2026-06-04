import Link from "next/link";
import { VideoUrlForm } from "./video-url-form";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-16 shadow-[0_0_90px_-40px_rgba(34,211,238,0.65)] sm:px-10 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_45%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.2),transparent_40%)]" />

      <div className="relative">
        <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
          Creator&apos;s Hub MVP
        </p>

        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Real AI feedback for the exact video you want to improve.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Paste a YouTube link, then add your transcript to get a creator
          scorecard with practical advice on hook, pacing, packaging, and search
          discoverability.
        </p>

        <VideoUrlForm />

        <p className="mt-3 max-w-2xl text-sm text-slate-400">
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
    </section>
  );
}
