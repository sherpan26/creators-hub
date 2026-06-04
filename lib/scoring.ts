// Creator Scorecard — scoring model types and tuning constants.
//
// This module is PURE and ISOMORPHIC: no I/O, no fetch, no `server-only`
// import, so the same code can run in a server route (authoritative, at save
// time) or in the browser (optional live preview). See docs/scoring-plan.md.
//
// Phase A (this file): types + tuning constants only. The deterministic scorer
// `computeScorecard()` lands in Phase B.

import type { VideoDetails } from "./youtube";
import type { TranscriptAnalysis } from "./transcript";
import type { GeminiTranscriptFeedback } from "./gemini";

/**
 * Bump when the scoring algorithm changes in a way that makes old scores not
 * comparable to new ones. Stored alongside each scorecard so historical reports
 * stay reproducible and can be targeted for backfills.
 */
export const SCORE_VERSION = "1.0.0";

/** The six weighted categories that make up the overall score. */
export type CategoryKey =
  | "hook"
  | "pacing"
  | "packaging"
  | "seo"
  | "engagement"
  | "clarity";

export type RatingLabel =
  | "Weak"
  | "Needs Work"
  | "Decent"
  | "Strong"
  | "Excellent";

export type Confidence = "high" | "medium" | "low";

/**
 * Inputs to computeScorecard(). Mirrors the data already available at
 * POST /api/reports (videoDetails + transcriptAnalysis + transcriptText +
 * geminiFeedback). geminiFeedback is null when Gemini failed and the report fell
 * back to local analysis — the scorer then runs deterministic-only.
 */
export type ScorecardInput = {
  youtubeUrl: string;
  videoDetails: VideoDetails;
  transcriptAnalysis: TranscriptAnalysis;
  transcriptText: string;
  geminiFeedback: GeminiTranscriptFeedback | null;
};

export type CategoryBreakdown = {
  category: CategoryKey;
  label: string;
  // 0–100, or null when there was insufficient data to score the category
  // (it is then excluded from the overall and its weight is redistributed).
  score: number | null;
  weight: number; // effective weight used in the overall, after renormalization
  rating: RatingLabel | null;
  confidence: Confidence;
  reason: string; // one-line human summary
  signals: string[]; // deterministic facts that drove the score
  geminiInfluenced: boolean;
};

export type CreatorScorecard = {
  scoreVersion: string;
  generatedAt: string; // ISO timestamp
  overallScore: number; // 0–100
  ratingLabel: RatingLabel;
  categoryScores: Record<CategoryKey, number | null>;
  breakdown: CategoryBreakdown[];
  strengths: string[];
  weaknesses: string[];
  topFixes: string[]; // Gemini.topFixes ∪ deterministic fixes, deduped, max 5
  inputs: {
    geminiUsed: boolean;
    hadEngagementData: boolean;
    transcriptWordCount: number;
    dataCompleteness: "full" | "partial" | "minimal";
  };
};

// ---------------------------------------------------------------------------
// Tuning constants (the design's knobs — see docs/scoring-plan.md §4–§5).
// ---------------------------------------------------------------------------

/**
 * Overall-score weights. Must sum to 100. Hook is weighted highest (biggest
 * retention lever); Engagement lowest (an outcome, noisy for small/new videos,
 * and confidence-gated to avoid popularity bias).
 */
export const WEIGHTS: Record<CategoryKey, number> = {
  hook: 25,
  pacing: 20,
  packaging: 20,
  clarity: 15,
  seo: 12,
  engagement: 8,
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  hook: "Hook",
  pacing: "Pacing / Structure",
  packaging: "Packaging / Title",
  seo: "SEO / Discoverability",
  engagement: "Engagement",
  clarity: "Clarity",
};

/**
 * Rating bands, applied to the overall score and to each category. Ordered from
 * lowest to highest; bands are inclusive on both ends.
 */
export const RATING_BANDS: ReadonlyArray<{
  min: number;
  max: number;
  label: RatingLabel;
}> = [
  { min: 0, max: 39, label: "Weak" },
  { min: 40, max: 59, label: "Needs Work" },
  { min: 60, max: 74, label: "Decent" },
  { min: 75, max: 89, label: "Strong" },
  { min: 90, max: 100, label: "Excellent" },
];

/**
 * Neutral fallback score (low end of "Decent"). Low-confidence categories are
 * pulled toward this value instead of toward an extreme.
 */
export const NEUTRAL_SCORE = 60;

/** Multipliers applied when pulling a score toward NEUTRAL_SCORE by confidence. */
export const CONFIDENCE_FACTORS: Record<Confidence, number> = {
  high: 1,
  medium: 0.7,
  low: 0.4,
};

/**
 * Bounded-blend parameters. Gemini may nuance but never hijack a category: the
 * blended result is clamped to ±maxGeminiDelta of the deterministic score. Only
 * applied to categories Gemini scores numerically (hook, pacing, seo).
 */
export const BLEND = {
  deterministicWeight: 0.65,
  geminiWeight: 0.35,
  maxGeminiDelta: 20,
} as const;

/** Categories Gemini provides a numeric suggestion for (see lib/gemini.ts). */
export const GEMINI_SCORED_CATEGORIES: ReadonlyArray<CategoryKey> = [
  "hook",
  "pacing",
  "seo",
];

/**
 * If our computed overall and Gemini's suggested overall diverge by more than
 * this, top-level confidence is lowered and the divergence is noted.
 */
export const OVERALL_SANITY_DELTA = 25;
