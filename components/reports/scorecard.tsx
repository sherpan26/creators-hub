import type { ComponentType } from "react";
import type { CreatorScorecard, CategoryKey } from "@/lib/scoring";
import { ScoreRing } from "@/components/ui/score-ring";
import { ratingChipClass, ratingBarClass } from "@/components/ui/rating";
import {
  ScorecardIcon,
  SparkleIcon,
  TargetIcon,
  PacingIcon,
  TagIcon,
  SearchIcon,
  HeartIcon,
  TranscriptIcon,
  TrendingUpIcon,
  AlertIcon,
  BoltIcon,
} from "@/components/ui/icons";

type ScorecardProps = {
  scorecard: CreatorScorecard | null;
};

const CATEGORY_ICONS: Record<CategoryKey, ComponentType<{ className?: string }>> = {
  hook: TargetIcon,
  pacing: PacingIcon,
  packaging: TagIcon,
  seo: SearchIcon,
  engagement: HeartIcon,
  clarity: TranscriptIcon,
};

/**
 * Premium, analytics-style scorecard for the report detail page. Renders the
 * stored CreatorScorecard, or a clean fallback for older reports. Pure display —
 * it never recomputes scores.
 */
export function Scorecard({ scorecard }: ScorecardProps) {
  if (!scorecard) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 text-slate-200">
          <ScorecardIcon className="h-5 w-5 text-cyan-300" />
          <h3 className="text-xl font-semibold text-white">Creator Scorecard</h3>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Scorecard unavailable for this report.
        </p>
      </section>
    );
  }

  const {
    overallScore,
    ratingLabel,
    breakdown,
    strengths,
    weaknesses,
    topFixes,
    inputs,
    scoreVersion,
  } = scorecard;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
      {/* Header / overall */}
      <div className="relative border-b border-white/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_-20%,rgba(34,211,238,0.18),transparent_45%)]" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              <ScorecardIcon className="h-4 w-4" />
              Creator Scorecard
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Overall score
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <span className={ratingChipClass(ratingLabel)}>{ratingLabel}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
                <SparkleIcon className="h-3 w-3 text-cyan-300" />
                {inputs.geminiUsed ? "AI-assisted" : "Heuristic-only"}
              </span>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 sm:inline">
                data: {inputs.dataCompleteness} · v{scoreVersion}
              </span>
            </div>
          </div>

          <ScoreRing score={overallScore} caption="/ 100" />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Category breakdown
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {breakdown.map((b) => {
            const Icon = CATEGORY_ICONS[b.category];
            const scored = b.score !== null;
            return (
              <article
                key={b.category}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Icon className="h-4 w-4 text-slate-400" />
                    {b.label}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-white">
                    {scored ? b.score : "—"}
                    {scored ? (
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    ) : null}
                  </p>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${ratingBarClass(b.rating)}`}
                    style={{ width: `${b.score ?? 0}%` }}
                    aria-hidden
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={ratingChipClass(b.rating)}>
                    {b.rating ?? "No data"}
                  </span>
                  {b.confidence !== "high" ? (
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {b.confidence} confidence
                    </span>
                  ) : null}
                  {b.geminiInfluenced ? (
                    <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-cyan-300/70">
                      <SparkleIcon className="h-3 w-3" />
                      AI
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-xs leading-6 text-slate-300">{b.reason}</p>

                {b.signals.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[11px] leading-5 text-slate-400">
                    {b.signals.map((signal, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span aria-hidden className="text-slate-600">
                          •
                        </span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>

        {/* Coaching notes */}
        {strengths.length > 0 || weaknesses.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {strengths.length > 0 ? (
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <TrendingUpIcon className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                  {strengths.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="mt-1 text-emerald-400">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weaknesses.length > 0 ? (
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <AlertIcon className="h-4 w-4" />
                  Weaknesses
                </h4>
                <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                  {weaknesses.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="mt-1 text-amber-400">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {topFixes.length > 0 ? (
          <div className="mt-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BoltIcon className="h-4 w-4 text-cyan-300" />
              Top fixes
            </h4>
            <ol className="mt-3 space-y-3 text-sm text-slate-300">
              {topFixes.map((fix, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-cyan-300/15 text-xs font-semibold text-cyan-200">
                    {index + 1}
                  </span>
                  <span className="leading-6">{fix}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
