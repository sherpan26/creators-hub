import type { CreatorScorecard, RatingLabel } from "@/lib/scoring";

type ScorecardProps = {
  scorecard: CreatorScorecard | null;
};

const RATING_CHIP: Record<RatingLabel, string> = {
  Weak: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  "Needs Work": "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  Decent: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  Strong: "bg-cyan-300/10 text-cyan-200 ring-cyan-300/20",
  Excellent: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
};

function ratingChipClass(label: RatingLabel | null): string {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";
  return label
    ? `${base} ${RATING_CHIP[label]}`
    : `${base} bg-slate-500/10 text-slate-400 ring-slate-500/20`;
}

/**
 * Presentational scorecard for the report detail page. Renders the stored
 * CreatorScorecard, or a clean fallback when none exists (older reports). Pure
 * display — it never recomputes scores.
 */
export function Scorecard({ scorecard }: ScorecardProps) {
  if (!scorecard) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h3 className="text-xl font-semibold text-white">Creator Scorecard</h3>
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Creator Scorecard</h3>
          <p className="mt-1 text-xs text-slate-400">
            {inputs.geminiUsed ? "AI-assisted" : "Heuristic-only"} · data:{" "}
            {inputs.dataCompleteness} · v{scoreVersion}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-3xl font-semibold text-white">
            {overallScore}
            <span className="text-base font-normal text-slate-400">/100</span>
          </p>
          <span className={ratingChipClass(ratingLabel)}>{ratingLabel}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {breakdown.map((b) => {
          const scored = b.score !== null;
          const pct = b.score ?? 0;
          return (
            <article
              key={b.category}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-200">{b.label}</p>
                <p className="text-lg font-semibold text-cyan-200">
                  {scored ? b.score : "—"}
                  {scored ? (
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  ) : null}
                </p>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
                  style={{ width: `${pct}%` }}
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
                  <span className="text-[11px] uppercase tracking-wide text-cyan-300/70">
                    AI-assisted
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

      {strengths.length > 0 || weaknesses.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {strengths.length > 0 ? (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
              <h4 className="text-sm font-semibold text-emerald-300">Strengths</h4>
              <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                {strengths.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {weaknesses.length > 0 ? (
            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-5">
              <h4 className="text-sm font-semibold text-rose-300">Weaknesses</h4>
              <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                {weaknesses.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {topFixes.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-white">Top Fixes</h4>
          <ol className="mt-3 space-y-3 text-sm text-slate-300">
            {topFixes.map((fix, index) => (
              <li
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <span className="font-semibold text-cyan-200">{index + 1}.</span>{" "}
                {fix}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
