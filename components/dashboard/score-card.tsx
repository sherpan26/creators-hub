import type { ScoreItem } from "@/lib/mock/dashboard";

type ScoreCardProps = {
  item: ScoreItem;
};

export function ScoreCard({ item }: ScoreCardProps) {
  const percentage = Math.round((item.value / item.max) * 100);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-200">{item.label}</p>
        <p className="text-lg font-semibold text-cyan-200">
          {item.value}/{item.max}
        </p>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
          style={{ width: `${percentage}%` }}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-300">{item.note}</p>
    </article>
  );
}
