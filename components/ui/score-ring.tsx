import { ratingFromScore, ratingHex } from "./rating";

type ScoreRingProps = {
  score: number | null;
  size?: number;
  stroke?: number;
  /** Small caption under the number (e.g. "/100" or "Overall"). */
  caption?: string;
};

/**
 * Circular score gauge. Pure SVG (no deps), colored by rating band. Renders a
 * neutral track plus a colored arc for the score. Server-component safe.
 */
export function ScoreRing({ score, size = 132, stroke = 10, caption }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
  const color = score == null ? "#64748b" : ratingHex(ratingFromScore(score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-semibold tabular-nums text-white">
          {score ?? "—"}
        </span>
        {caption ? (
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}
