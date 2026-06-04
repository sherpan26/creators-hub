import type { ScoreItem } from "@/lib/mock/dashboard";
import { ScoreCard } from "./score-card";

type ScoreGridProps = {
  scores: ScoreItem[];
};

export function ScoreGrid({ scores }: ScoreGridProps) {
  return (
    <section aria-labelledby="score-grid-heading" className="mt-10">
      <h2
        id="score-grid-heading"
        className="text-2xl font-semibold tracking-tight text-white"
      >
        Creator Scorecard
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        Mock AI evaluation for this video across core growth dimensions.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scores.map((score) => (
          <ScoreCard key={score.label} item={score} />
        ))}
      </div>
    </section>
  );
}
