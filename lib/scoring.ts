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

// ---------------------------------------------------------------------------
// Phase B — deterministic scorer.
//
// computeScorecard() is PURE: same input → same output (the only clock read,
// `generatedAt`, is injectable for tests). No fetch, no DB, no React, no env.
// ---------------------------------------------------------------------------

/** Internal per-category result before Gemini blend / confidence pull. */
type RawCategory = {
  det: number | null; // deterministic score 0–100, or null = insufficient data
  confidence: Confidence;
  signals: string[];
  reason: string;
};

const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "if", "then", "that", "this", "these",
  "those", "to", "of", "in", "on", "for", "with", "as", "at", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "it", "its", "i", "you",
  "your", "we", "our", "they", "he", "she", "his", "her", "them", "me", "my",
  "do", "does", "did", "so", "just", "about", "into", "than", "too", "very",
  "can", "will", "would", "should", "could", "what", "when", "where", "which",
  "who", "how", "why", "not", "no", "yes", "up", "out", "get", "got", "go",
  "going", "really", "one", "also", "more", "most", "some", "here", "there",
]);

// Conservative filler set — bare "like"/"right" are excluded to avoid counting
// their legitimate uses.
const FILLER_PATTERNS: RegExp[] = [
  /\bum\b/g, /\buh\b/g, /\ber\b/g, /\bbasically\b/g, /\bliterally\b/g,
  /\bactually\b/g, /\byou know\b/g, /\bi mean\b/g, /\bsort of\b/g,
  /\bkind of\b/g, /\bkinda\b/g, /\bsorta\b/g,
];

const PROMISE_RE =
  /(you'?ll|you will|how to|i'?ll show|i will show|learn|want to|discover|the result|in this video|by the end|going to show|let me show|here'?s how|teach you)/i;
const CURIOSITY_RE =
  /(\?|what happened|nobody tells you|the truth|biggest mistake|secret|stop doing|don'?t make|why you|the reason)/i;
const HOUSEKEEPING_RE =
  /^(hey|hi|yo|hello|what'?s up|good morning|good evening|welcome back)\b/i;
const SUBSCRIBE_RE =
  /(smash (that|the)? ?like|hit subscribe|like and subscribe|don'?t forget to subscribe)/i;

/** Actionable one-liner used as a topFix when a category is a weakness. */
const CATEGORY_FIXES: Record<CategoryKey, string> = {
  hook: "Open with the payoff in the first sentence — state what the viewer gets.",
  pacing: "Tighten pacing: add clear sections/timestamps and cut filler words.",
  packaging: "Sharpen the title around one specific benefit (add a number or outcome).",
  seo: "Add a keyword-rich description that matches your title and topic.",
  engagement: "Add a clear call-to-action to lift likes and comments.",
  clarity: "Use shorter sentences and a clear promise so the point lands faster.",
};

// --- small pure helpers ----------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round(n: number): number {
  return Math.round(n);
}

function ratingFromScore(score: number): RatingLabel {
  for (const band of RATING_BANDS) {
    if (score >= band.min && score <= band.max) return band.label;
  }
  return score < 0 ? "Weak" : "Excellent";
}

function leveledReason(det: number, strong: string, ok: string, weak: string): string {
  return det >= 75 ? strong : det >= 60 ? ok : weak;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function contentTerms(text: string): string[] {
  return tokenize(text).filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

/** Top-N most frequent content words, as a lookup set. */
function salientTerms(text: string, limit: number): Set<string> {
  const freq = new Map<string, number>();
  for (const w of contentTerms(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const ranked = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((e) => e[0]);
  return new Set(ranked);
}

/** Parses "12,483" / "1.2K" / "3.4M" / number → integer, or null if unknown. */
function parseCount(raw: string | number | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, "");
  if (!s) return null;
  const m = s.match(/^([\d.]+)([km])?$/);
  if (m) {
    let n = parseFloat(m[1]);
    if (Number.isNaN(n)) return null;
    if (m[2] === "k") n *= 1_000;
    else if (m[2] === "m") n *= 1_000_000;
    return Math.round(n);
  }
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/** Fraction of repeated trigrams (0 = none repeated, higher = more repetition). */
function repeatedTrigramRatio(tokens: string[]): number {
  if (tokens.length < 6) return 0;
  const grams = new Map<string, number>();
  for (let i = 0; i + 2 < tokens.length; i++) {
    const g = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    grams.set(g, (grams.get(g) ?? 0) + 1);
  }
  let repeated = 0;
  let total = 0;
  for (const c of Array.from(grams.values())) {
    total += c;
    if (c > 1) repeated += c - 1;
  }
  return total > 0 ? repeated / total : 0;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it.trim());
  }
  return out;
}

// --- per-category deterministic scorers ------------------------------------

function scoreHook(input: ScorecardInput): RawCategory {
  const { transcriptAnalysis: ta, transcriptText } = input;
  const snippet = ta.hookSnippet || transcriptText.slice(0, 300);
  const head = snippet.slice(0, 150);
  const signals: string[] = [];
  let score = NEUTRAL_SCORE;

  if (snippet.trim().length < 40) {
    score -= 15;
    signals.push("Opening is very short (under 40 characters).");
  }
  if (PROMISE_RE.test(head)) {
    score += 12;
    signals.push("States a clear promise early.");
  } else {
    score -= 6;
    signals.push("No explicit viewer promise in the first lines.");
  }
  if (CURIOSITY_RE.test(snippet)) {
    score += 10;
    signals.push("Uses a curiosity or tension device.");
  }
  if (/\d/.test(head)) {
    score += 8;
    signals.push("Opens with a concrete number/specific.");
  }
  if (HOUSEKEEPING_RE.test(snippet.trim()) || SUBSCRIBE_RE.test(head)) {
    score -= 10;
    signals.push("Opens with housekeeping/greeting before value.");
  }
  if (ta.introTooLong) {
    score -= 12;
    signals.push("Intro runs long — the promise is buried.");
  }

  const det = clamp(score, 0, 100);
  const confidence: Confidence =
    ta.wordCount < 30 ? "low" : snippet.length < 80 ? "medium" : "high";
  return {
    det,
    confidence,
    signals,
    reason: leveledReason(
      det,
      "Strong, specific opening.",
      "Decent opening; sharpen the promise.",
      "Weak opening — lead with the payoff sooner.",
    ),
  };
}

function scorePacing(input: ScorecardInput): RawCategory {
  const { transcriptAnalysis: ta, transcriptText, youtubeUrl } = input;
  const tokens = tokenize(transcriptText);
  const isShort = /\/shorts\//.test(youtubeUrl) || ta.wordCount < 200;
  const signals: string[] = [];
  let score = NEUTRAL_SCORE;

  if (isShort) {
    signals.push("Short-form video — brevity not penalized.");
  } else {
    const s = ta.speakingSeconds;
    if (s < 60) {
      score -= 18;
      signals.push("Very short for long-form (under 1 min).");
    } else if (s < 180) {
      score -= 6;
      signals.push("On the short side (1–3 min).");
    } else if (s <= 900) {
      score += 10;
      signals.push("Length in the 3–15 min sweet spot.");
    } else if (s <= 1500) {
      score += 2;
      signals.push("Slightly long (15–25 min).");
    } else {
      score -= 6;
      signals.push("Very long (over 25 min) — consider tightening.");
    }
  }

  if (ta.paragraphCount >= 3) {
    score += 10;
    signals.push(`Segmented into ${ta.paragraphCount} sections.`);
  } else {
    score -= 8;
    signals.push("Few distinct sections/paragraphs.");
  }
  if (ta.timestampsFound) {
    score += 8;
    signals.push("Includes timestamps/chapters.");
  }
  if (ta.introTooLong) {
    score -= 10;
    signals.push("Intro runs long.");
  }

  const lower = transcriptText.toLowerCase();
  let fillerHits = 0;
  for (const re of FILLER_PATTERNS) fillerHits += (lower.match(re) ?? []).length;
  const fillerRatio = ta.wordCount > 0 ? fillerHits / ta.wordCount : 0;
  if (fillerRatio > 0.06) {
    score -= 20;
    signals.push(`High filler density (${(fillerRatio * 100).toFixed(1)}%).`);
  } else if (fillerRatio > 0.03) {
    score -= 12;
    signals.push(`Some filler words (${(fillerRatio * 100).toFixed(1)}%).`);
  } else if (fillerRatio < 0.01) {
    score += 4;
    signals.push("Very little filler.");
  }

  const rep = repeatedTrigramRatio(tokens);
  if (rep > 0.15) {
    score -= 12;
    signals.push("Noticeably repetitive phrasing.");
  } else if (rep > 0.08) {
    score -= 6;
    signals.push("Some repeated phrasing.");
  }

  const det = clamp(score, 0, 100);
  const confidence: Confidence =
    ta.wordCount < 60 ? "low" : ta.wordCount < 150 ? "medium" : "high";
  return {
    det,
    confidence,
    signals,
    reason: leveledReason(
      det,
      "Well-paced and structured.",
      "Reasonable pacing with a few drags.",
      "Pacing/structure needs work.",
    ),
  };
}

function scorePackaging(input: ScorecardInput): RawCategory {
  const { videoDetails: v, transcriptText, geminiFeedback } = input;
  const title = (v.title || "").trim();
  if (!title) {
    return {
      det: clamp(NEUTRAL_SCORE - 20, 0, 100),
      confidence: "low",
      signals: ["No title provided."],
      reason: "No title to evaluate.",
    };
  }

  const signals: string[] = [];
  let score = NEUTRAL_SCORE;
  const len = title.length;
  if (len >= 40 && len <= 70) {
    score += 12;
    signals.push(`Title length ideal (${len} chars).`);
  } else if (len >= 25 && len < 40) {
    score += 2;
    signals.push(`Title slightly short (${len} chars).`);
  } else if (len < 25) {
    score -= 15;
    signals.push(`Title very short/vague (${len} chars).`);
  } else if (len <= 80) {
    score += 2;
    signals.push(`Title length okay (${len} chars).`);
  } else {
    score -= 10;
    signals.push(`Title may truncate on mobile (${len} chars).`);
  }

  if (/\d|\bhow to\b|\bdays?\b|\bminutes?\b|\bways?\b|\btips?\b|\bsteps?\b|\bguide\b|\btutorial\b|\breview\b|\bvs\b/i.test(title)) {
    score += 8;
    signals.push("Title is specific (number/outcome/format).");
  } else {
    score -= 4;
    signals.push("Title lacks a specific hook (number, outcome, format).");
  }

  if (title === title.toUpperCase() && /[A-Z]/.test(title)) {
    score -= 8;
    signals.push("Title is all caps.");
  }
  if (/(you won'?t believe|shocking|insane|gone wrong|!!!+)/i.test(title) && !/\d/.test(title)) {
    score -= 6;
    signals.push("Clickbait phrasing without substance.");
  }

  const salient = salientTerms(transcriptText, 25);
  const titleTerms = contentTerms(title);
  const overlap = titleTerms.filter((w) => salient.has(w)).length;
  if (overlap >= 2) {
    score += 8;
    signals.push("Title matches the video's main topic.");
  } else if (overlap === 0 && titleTerms.length > 0) {
    score -= 4;
    signals.push("Title keywords don't match the transcript topic.");
  }

  // Thumbnail is folded into Packaging only as a qualitative note when Gemini
  // mentions it — we never fabricate an image score (no vision input).
  if (geminiFeedback && /thumbnail/i.test(geminiFeedback.titleThumbnailSuggestions || "")) {
    signals.push("AI flagged the thumbnail — review packaging visuals.");
  }

  const det = clamp(score, 0, 100);
  return {
    det,
    confidence: "high",
    signals,
    reason: leveledReason(
      det,
      "Strong, specific packaging.",
      "Decent title; sharpen the promise.",
      "Packaging needs a clearer, specific title.",
    ),
  };
}

function scoreSeo(input: ScorecardInput): RawCategory {
  const { videoDetails: v, transcriptText, transcriptAnalysis: ta } = input;
  const title = (v.title || "").trim();
  const desc = (v.description || "").trim();
  const signals: string[] = [];
  let score = NEUTRAL_SCORE;

  if (!desc) {
    score -= 20;
    signals.push("No description.");
  } else if (desc.length < 50) {
    score -= 10;
    signals.push("Very short description.");
  } else if (desc.length >= 150) {
    score += 10;
    signals.push("Detailed description.");
  } else {
    score += 2;
    signals.push("Has a basic description.");
  }

  const salient = salientTerms(transcriptText, 25);
  const titleMatch = contentTerms(title).filter((w) => salient.has(w)).length;
  const descMatch = contentTerms(desc).filter((w) => salient.has(w)).length;
  const consistency = Math.min(15, titleMatch * 4 + descMatch * 2);
  if (consistency > 0) {
    score += consistency;
    signals.push("Keywords consistent across title/description/transcript.");
  } else {
    score -= 6;
    signals.push("Weak keyword consistency across title/description/transcript.");
  }

  if (ta.timestampsFound) {
    score += 8;
    signals.push("Timestamps aid chapter SEO.");
  }
  if (/how to|why|what|best|guide|tutorial|tips|review|\bvs\b|\?/i.test(title)) {
    score += 6;
    signals.push("Searchable title framing.");
  }

  const det = clamp(score, 0, 100);
  const confidence: Confidence = !title && !desc ? "low" : !desc ? "medium" : "high";
  return {
    det,
    confidence,
    signals,
    reason: leveledReason(
      det,
      "Discoverable and keyword-consistent.",
      "Okay discoverability; tighten keywords.",
      "Low discoverability — fix description & keywords.",
    ),
  };
}

function scoreEngagement(input: ScorecardInput): RawCategory {
  const { videoDetails: v } = input;
  const views = parseCount(v.views);
  const likes = typeof v.likeCount === "number" ? v.likeCount : null;
  const comments = typeof v.commentCount === "number" ? v.commentCount : null;

  // Insufficient data → null (excluded from the overall, weight redistributed).
  // "0"/hidden views are treated as unknown, never as a real zero.
  if (views === null || views === 0 || (likes === null && comments === null)) {
    return {
      det: null,
      confidence: "low",
      signals: [
        views === null || views === 0
          ? "View count unavailable or hidden."
          : `Views: ${views.toLocaleString()}.`,
        likes === null ? "Like count unavailable." : `Likes: ${likes.toLocaleString()}.`,
        comments === null ? "Comment count unavailable." : `Comments: ${comments.toLocaleString()}.`,
      ],
      reason: "Not enough public engagement data to score fairly.",
    };
  }

  const signals: string[] = [];
  let score = NEUTRAL_SCORE;

  // Scored ONLY on ratios — never raw counts — so small channels are judged
  // on how their audience responds, not on popularity.
  if (likes !== null) {
    const r = likes / views;
    if (r < 0.01) {
      score -= 15;
      signals.push(`Low like rate (${(r * 100).toFixed(1)}%).`);
    } else if (r < 0.03) {
      signals.push(`Average like rate (${(r * 100).toFixed(1)}%).`);
    } else if (r < 0.06) {
      score += 12;
      signals.push(`Good like rate (${(r * 100).toFixed(1)}%).`);
    } else {
      score += 20;
      signals.push(`Excellent like rate (${(r * 100).toFixed(1)}%).`);
    }
  }
  if (comments !== null) {
    const r = comments / views;
    if (r < 0.001) {
      score -= 8;
      signals.push(`Low comment rate (${(r * 100).toFixed(2)}%).`);
    } else if (r < 0.004) {
      score += 6;
      signals.push(`Good comment rate (${(r * 100).toFixed(2)}%).`);
    } else {
      score += 12;
      signals.push(`Excellent comment rate (${(r * 100).toFixed(2)}%).`);
    }
  }

  // Fairness: small samples / single-signal lower confidence (which pulls the
  // score toward neutral later) — never a hard fail just for being small.
  let confidence: Confidence = "high";
  if (views < 100) {
    confidence = "low";
    signals.push(`Small sample (${views.toLocaleString()} views) — scored cautiously.`);
  } else if (likes === null || comments === null) {
    confidence = "medium";
  }

  const det = clamp(score, 0, 100);
  return {
    det,
    confidence,
    signals,
    reason: leveledReason(
      det,
      "Strong audience response (normalized).",
      "Healthy engagement for its reach.",
      "Engagement below typical for its reach.",
    ),
  };
}

function scoreClarity(input: ScorecardInput): RawCategory {
  const { transcriptText, transcriptAnalysis: ta } = input;
  const tokens = tokenize(transcriptText);
  const sentences = splitSentences(transcriptText);
  const signals: string[] = [];
  let score = NEUTRAL_SCORE;
  let confidence: Confidence = "high";

  if (sentences.length === 0) {
    signals.push("Transcript lacks sentence punctuation (auto-captions?).");
    confidence = "low";
  } else {
    const avgLen = tokens.length / sentences.length;
    if (avgLen > 25) {
      score -= 12;
      signals.push(`Long run-on sentences (avg ${avgLen.toFixed(0)} words).`);
    } else if (avgLen >= 6) {
      score += 6;
      signals.push(`Readable sentence length (avg ${avgLen.toFixed(0)} words).`);
    } else {
      score -= 4;
      signals.push(`Very choppy sentences (avg ${avgLen.toFixed(0)} words).`);
    }
  }

  if (tokens.length > 0) {
    const ttr = new Set(tokens).size / tokens.length;
    if (ttr < 0.3) {
      score -= 10;
      signals.push("Repetitive vocabulary.");
    } else if (ttr > 0.5) {
      score += 6;
      signals.push("Varied vocabulary.");
    }
  }

  if (repeatedTrigramRatio(tokens) > 0.12) {
    score -= 8;
    signals.push("Repeated phrases reduce clarity.");
  }

  if (PROMISE_RE.test(ta.hookSnippet || transcriptText.slice(0, 150))) {
    score += 6;
    signals.push("States a clear promise.");
  } else {
    score -= 4;
    signals.push("No clear promise of what the viewer will get.");
  }

  if (ta.paragraphCount >= 3 && !ta.introTooLong) {
    score += 4;
    signals.push("Clear overall structure.");
  }

  if (ta.wordCount < 60) confidence = "low";
  else if (ta.wordCount < 150 && confidence !== "low") confidence = "medium";

  const det = clamp(score, 0, 100);
  return {
    det,
    confidence,
    signals,
    reason: leveledReason(
      det,
      "Clear and easy to follow.",
      "Mostly clear; simplify in places.",
      "Clarity needs work — simplify and structure.",
    ),
  };
}

// --- orchestration ---------------------------------------------------------

/**
 * Computes a complete CreatorScorecard from the available report inputs.
 *
 * Deterministic heuristics form the base of every category; Gemini's numeric
 * suggestions (hook/pacing/seo only) nudge — but never hijack — those bases
 * (bounded to ±BLEND.maxGeminiDelta). A missing/invalid Gemini result still
 * yields a complete scorecard. Categories without enough data (typically
 * Engagement) are excluded from the overall and their weight redistributed.
 *
 * Pure: the optional `now` makes the only clock read injectable for tests.
 */
export function computeScorecard(
  input: ScorecardInput,
  now: string = new Date().toISOString(),
): CreatorScorecard {
  const gemini = input.geminiFeedback;
  const geminiUsed = gemini !== null;

  const raw: Record<CategoryKey, RawCategory> = {
    hook: scoreHook(input),
    pacing: scorePacing(input),
    packaging: scorePackaging(input),
    seo: scoreSeo(input),
    engagement: scoreEngagement(input),
    clarity: scoreClarity(input),
  };

  const geminiScores: Partial<Record<CategoryKey, number>> = gemini
    ? {
        hook: gemini.scoreSuggestions.hook,
        pacing: gemini.scoreSuggestions.pacing,
        seo: gemini.scoreSuggestions.seo,
      }
    : {};

  const categories = Object.keys(raw) as CategoryKey[];

  // Blend Gemini (bounded) + pull toward neutral by confidence.
  const finals: Record<CategoryKey, { score: number | null; influenced: boolean }> =
    {} as Record<CategoryKey, { score: number | null; influenced: boolean }>;
  for (const cat of categories) {
    const r = raw[cat];
    if (r.det === null) {
      finals[cat] = { score: null, influenced: false };
      continue;
    }
    let value = r.det;
    let influenced = false;
    if (geminiUsed && GEMINI_SCORED_CATEGORIES.includes(cat)) {
      const g = geminiScores[cat];
      if (typeof g === "number" && g > 0) {
        const blended = BLEND.deterministicWeight * r.det + BLEND.geminiWeight * g;
        value = clamp(blended, r.det - BLEND.maxGeminiDelta, r.det + BLEND.maxGeminiDelta);
        influenced = true;
      }
    }
    const f = CONFIDENCE_FACTORS[r.confidence];
    value = f * value + (1 - f) * NEUTRAL_SCORE;
    finals[cat] = { score: clamp(round(value), 0, 100), influenced };
  }

  const available = categories.filter((c) => finals[c].score !== null);
  const weightSum = available.reduce((sum, c) => sum + WEIGHTS[c], 0) || 1;

  const breakdown: CategoryBreakdown[] = categories.map((cat) => {
    const r = raw[cat];
    const final = finals[cat];
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      score: final.score,
      // Effective contribution to the overall, as a percent (renormalized).
      weight: final.score === null ? 0 : round((WEIGHTS[cat] / weightSum) * 1000) / 10,
      rating: final.score === null ? null : ratingFromScore(final.score),
      confidence: r.confidence,
      reason: r.reason,
      signals: r.signals,
      geminiInfluenced: final.influenced,
    };
  });

  const categoryScores = {} as Record<CategoryKey, number | null>;
  for (const b of breakdown) categoryScores[b.category] = b.score;

  const overallRaw =
    available.reduce((sum, c) => sum + (finals[c].score as number) * WEIGHTS[c], 0) /
    weightSum;
  const overallScore = clamp(round(overallRaw), 0, 100);

  // Strengths (Strong+, else the single best) and weaknesses (below "Decent").
  const ranked = breakdown
    .filter((b) => b.score !== null)
    .sort((a, b) => (b.score as number) - (a.score as number));

  const strengths = ranked
    .filter((b) => (b.score as number) >= 75)
    .slice(0, 3)
    .map((b) => `${b.label}: ${b.reason}`);
  if (strengths.length === 0 && ranked.length > 0) {
    strengths.push(`${ranked[0].label}: ${ranked[0].reason}`);
  }

  const weakCats = ranked.slice().reverse().filter((b) => (b.score as number) < 60);
  const weaknesses = weakCats.slice(0, 3).map((b) => `${b.label}: ${b.reason}`);

  // topFixes: Gemini's fixes first, then deterministic fixes for weak categories.
  const fixes: string[] = [];
  if (gemini) {
    for (const f of gemini.topFixes) {
      if (typeof f === "string" && f.trim()) fixes.push(f.trim());
    }
  }
  for (const b of weakCats) fixes.push(CATEGORY_FIXES[b.category]);
  const topFixes = dedupe(fixes).slice(0, 5);

  const wordCount = input.transcriptAnalysis.wordCount;
  const hadEngagementData = categoryScores.engagement !== null;
  const hasDescription = Boolean((input.videoDetails.description || "").trim());
  let dataCompleteness: "full" | "partial" | "minimal";
  if (wordCount < 60 || (!geminiUsed && !hadEngagementData)) {
    dataCompleteness = "minimal";
  } else if (geminiUsed && hadEngagementData && hasDescription && wordCount >= 150) {
    dataCompleteness = "full";
  } else {
    dataCompleteness = "partial";
  }

  return {
    scoreVersion: SCORE_VERSION,
    generatedAt: now,
    overallScore,
    ratingLabel: ratingFromScore(overallScore),
    categoryScores,
    breakdown,
    strengths,
    weaknesses,
    topFixes,
    inputs: { geminiUsed, hadEngagementData, transcriptWordCount: wordCount, dataCompleteness },
  };
}
