// Shared rating → color mapping for scorecards and report cards, so score
// colors stay consistent everywhere. Built on the rating bands in lib/scoring.

import { RATING_BANDS, type RatingLabel } from "@/lib/scoring";

export function ratingFromScore(score: number): RatingLabel {
  const band = RATING_BANDS.find((b) => score >= b.min && score <= b.max);
  return band ? band.label : score < 0 ? "Weak" : "Excellent";
}

/** Pill/chip classes per rating (dark theme, ring-inset). */
const RATING_CHIP: Record<RatingLabel, string> = {
  Weak: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  "Needs Work": "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  Decent: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  Strong: "bg-cyan-300/10 text-cyan-200 ring-cyan-300/20",
  Excellent: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
};

export function ratingChipClass(label: RatingLabel | null): string {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";
  return label
    ? `${base} ${RATING_CHIP[label]}`
    : `${base} bg-slate-500/10 text-slate-400 ring-slate-500/20`;
}

/** Solid hex per rating — for SVG strokes (score rings / bars). */
const RATING_HEX: Record<RatingLabel, string> = {
  Weak: "#fb7185", // rose-400
  "Needs Work": "#fbbf24", // amber-400
  Decent: "#38bdf8", // sky-400
  Strong: "#22d3ee", // cyan-400
  Excellent: "#34d399", // emerald-400
};

export function ratingHex(label: RatingLabel | null): string {
  return label ? RATING_HEX[label] : "#64748b"; // slate-500
}

/** Tailwind bar-fill class per rating — for category progress bars. */
const RATING_BAR: Record<RatingLabel, string> = {
  Weak: "bg-rose-400",
  "Needs Work": "bg-amber-400",
  Decent: "bg-sky-400",
  Strong: "bg-cyan-400",
  Excellent: "bg-emerald-400",
};

export function ratingBarClass(label: RatingLabel | null): string {
  return label ? RATING_BAR[label] : "bg-slate-600";
}
