import { ScoreRing } from "@/components/ui/score-ring";
import { ratingBarClass, ratingChipClass, ratingFromScore } from "@/components/ui/rating";
import {
  TargetIcon,
  PacingIcon,
  TagIcon,
  SearchIcon,
  SparkleIcon,
} from "@/components/ui/icons";

// Static sample scorecard — a product preview, clearly labelled "Sample" so it
// is never mistaken for a real analysis. Mirrors the real scorecard layout.
const SAMPLE = {
  overall: 81,
  categories: [
    { Icon: TargetIcon, label: "Hook", score: 84 },
    { Icon: PacingIcon, label: "Pacing", score: 73 },
    { Icon: TagIcon, label: "Packaging", score: 88 },
    { Icon: SearchIcon, label: "SEO", score: 69 },
  ],
};

export function ScorecardPreview() {
  const overallRating = ratingFromScore(SAMPLE.overall);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.45)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <SparkleIcon className="h-4 w-4 text-cyan-300" />
          Creator Scorecard
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Sample
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <ScoreRing score={SAMPLE.overall} size={108} caption="Overall" />
        <div>
          <span className={ratingChipClass(overallRating)}>{overallRating}</span>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Strong hook and packaging — tighten pacing and sharpen SEO before you
            post.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {SAMPLE.categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <cat.Icon className="h-4 w-4 text-slate-400" />
                {cat.label}
              </span>
              <span className="font-semibold tabular-nums text-white">{cat.score}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${ratingBarClass(ratingFromScore(cat.score))}`}
                style={{ width: `${cat.score}%` }}
                aria-hidden
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
