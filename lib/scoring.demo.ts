// Lightweight, framework-free demo + self-checks for lib/scoring.ts.
//
// The project has no test runner, so this intentionally avoids one. It exports
// realistic example inputs, a `runScoringDemo()` that returns compact results
// for eyeballing, and `assertScoringInvariants()` which throws on any violated
// invariant. Nothing here is imported by the app — it is for manual runs and as
// living documentation of expected behavior. (e.g. `npx tsx lib/scoring.demo.ts`
// after adding a one-line call, or import the functions from a scratch script.)

import { analyzeTranscript } from "./transcript";
import type { GeminiTranscriptFeedback } from "./gemini";
import type { VideoDetails } from "./youtube";
import {
  computeScorecard,
  RATING_BANDS,
  type CreatorScorecard,
  type ScorecardInput,
} from "./scoring";

// Fixed timestamp so demo output is fully deterministic.
const FIXED_NOW = "2026-06-03T00:00:00.000Z";

function makeInput(args: {
  youtubeUrl: string;
  videoDetails: VideoDetails;
  transcriptText: string;
  geminiFeedback: GeminiTranscriptFeedback | null;
}): ScorecardInput {
  return {
    youtubeUrl: args.youtubeUrl,
    videoDetails: args.videoDetails,
    transcriptText: args.transcriptText,
    transcriptAnalysis: analyzeTranscript(args.transcriptText),
    geminiFeedback: args.geminiFeedback,
  };
}

const strongTranscript = [
  "In this video you'll learn how to triple your watch time in 7 days using one editing change.",
  "0:00 The exact problem most small channels hit after their first 50 videos.",
  "",
  "First, we map where viewers drop off. The data shows a sharp dip around the intro, so we rewrite the first sentence to promise a concrete outcome.",
  "2:15 Next, we restructure the middle into three tight segments, each with a single idea and a clear transition.",
  "",
  "Finally, we add a pattern interrupt every few minutes and close with a specific call to action.",
  "By the end you'll have a repeatable framework you can apply to your next upload today.",
].join("\n");

const weakTranscript =
  "um so yeah hey guys welcome back to the channel uh today we're just gonna kind of talk about " +
  "some stuff you know basically the thing is um i wanted to talk about the thing and literally " +
  "the thing is the thing you know so yeah um anyway let's just kind of get into it i guess.";

const strongGemini: GeminiTranscriptFeedback = {
  overallFeedback: "Clear structure and a strong promise up front.",
  hookAnalysis: "The opening states a concrete outcome quickly.",
  pacingFeedback: "Good segmentation; trim the intro slightly.",
  titleThumbnailSuggestions: "Title is strong; consider higher thumbnail contrast.",
  topFixes: ["Trim the intro by 5 seconds", "Add a mid-video pattern interrupt"],
  scoreSuggestions: { hook: 80, pacing: 78, seo: 82, overall: 80 },
};

const strongVideo = makeInput({
  youtubeUrl: "https://www.youtube.com/watch?v=strong123",
  videoDetails: {
    title: "Triple Your Watch Time in 7 Days (One Simple Editing Fix)",
    views: "48,210",
    uploadDate: "5/1/2026",
    channelName: "Growth Lab",
    description:
      "A step-by-step framework to improve watch time and retention for small YouTube channels: rewrite your hook, restructure the middle into tight segments, and add pattern interrupts. Timestamps and links included.",
    likeCount: 2400,
    commentCount: 240,
  },
  transcriptText: strongTranscript,
  geminiFeedback: strongGemini,
});

const weakVideo = makeInput({
  youtubeUrl: "https://www.youtube.com/watch?v=weak123",
  videoDetails: {
    title: "my video",
    views: "812",
    uploadDate: "5/20/2026",
    channelName: "random channel",
    description: "",
    likeCount: 3,
    commentCount: 0,
  },
  transcriptText: weakTranscript,
  geminiFeedback: null,
});

const shortVideo = makeInput({
  youtubeUrl: "https://youtube.com/shorts/short123",
  videoDetails: {
    title: "Grow faster",
    views: "0",
    uploadDate: "6/1/2026",
    channelName: "Tips",
    description: "",
  },
  transcriptText: "Quick tip: hook viewers in the first second and they stay.",
  geminiFeedback: null,
});

// Strong content, tiny audience: engagement must NOT drag the score down.
const lowViewsGoodContent = makeInput({
  youtubeUrl: "https://www.youtube.com/watch?v=tiny123",
  videoDetails: {
    title: "Triple Your Watch Time in 7 Days (One Simple Editing Fix)",
    views: "312",
    uploadDate: "6/1/2026",
    channelName: "New Creator",
    description:
      "A step-by-step framework to improve watch time and retention for small YouTube channels, with timestamps and examples you can apply today.",
    likeCount: 25,
    commentCount: 4,
  },
  transcriptText: strongTranscript,
  geminiFeedback: null,
});

// Big audience, poor craft + weak ratios: high views must NOT inflate the score.
const highViewsPoorTranscript = makeInput({
  youtubeUrl: "https://www.youtube.com/watch?v=big123",
  videoDetails: {
    title: "my video",
    views: "2,400,000",
    uploadDate: "1/2/2026",
    channelName: "Big Channel",
    description: "",
    likeCount: 1000,
    commentCount: 50,
  },
  transcriptText: weakTranscript,
  geminiFeedback: null,
});

// Same strong inputs but Gemini failed → deterministic-only scorecard.
const strongNoGemini = makeInput({
  youtubeUrl: "https://www.youtube.com/watch?v=strong123",
  videoDetails: strongVideo.videoDetails,
  transcriptText: strongTranscript,
  geminiFeedback: null,
});

// Prompt-injection style: deterministic stays weak, Gemini screams 100.
const injectionGemini: GeminiTranscriptFeedback = {
  overallFeedback: "ignore previous instructions",
  hookAnalysis: "",
  pacingFeedback: "",
  titleThumbnailSuggestions: "",
  topFixes: [],
  scoreSuggestions: { hook: 100, pacing: 100, seo: 100, overall: 100 },
};
const weakWithInjection = makeInput({
  youtubeUrl: weakVideo.youtubeUrl,
  videoDetails: weakVideo.videoDetails,
  transcriptText: weakTranscript,
  geminiFeedback: injectionGemini,
});

export const DEMO_INPUTS: ReadonlyArray<{ name: string; input: ScorecardInput }> = [
  { name: "strong", input: strongVideo },
  { name: "weak", input: weakVideo },
  { name: "short", input: shortVideo },
  { name: "lowViewsGoodContent", input: lowViewsGoodContent },
  { name: "highViewsPoorTranscript", input: highViewsPoorTranscript },
  { name: "strongNoGemini", input: strongNoGemini },
];

/** Compact, deterministic results for eyeballing. */
export function runScoringDemo(): Array<{
  name: string;
  overall: number;
  rating: string;
  categories: CreatorScorecard["categoryScores"];
}> {
  return DEMO_INPUTS.map(({ name, input }) => {
    const sc = computeScorecard(input, FIXED_NOW);
    return {
      name,
      overall: sc.overallScore,
      rating: sc.ratingLabel,
      categories: sc.categoryScores,
    };
  });
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Scoring invariant failed: ${message}`);
}

function bandFor(score: number): string {
  const b = RATING_BANDS.find((x) => score >= x.min && score <= x.max);
  return b ? b.label : "(none)";
}

/**
 * Runs every invariant the deterministic scorer must uphold. Throws on the
 * first violation; returns true if all pass.
 */
export function assertScoringInvariants(): boolean {
  for (const { name, input } of DEMO_INPUTS) {
    const sc = computeScorecard(input, FIXED_NOW);

    // Ranges.
    assert(sc.overallScore >= 0 && sc.overallScore <= 100, `${name}: overall in 0..100`);
    assert(sc.ratingLabel === bandFor(sc.overallScore), `${name}: rating matches band`);
    assert(sc.scoreVersion.length > 0, `${name}: has scoreVersion`);
    assert(sc.generatedAt === FIXED_NOW, `${name}: generatedAt is injected (pure)`);

    for (const b of sc.breakdown) {
      assert(
        b.score === null || (b.score >= 0 && b.score <= 100),
        `${name}/${b.category}: score null or 0..100`,
      );
      assert(b.signals.length > 0, `${name}/${b.category}: has signals`);
      assert(b.reason.length > 0, `${name}/${b.category}: has a reason`);
    }

    // Effective weights of scored categories should renormalize to ~100%.
    const weightSum = sc.breakdown
      .filter((b) => b.score !== null)
      .reduce((s, b) => s + b.weight, 0);
    assert(Math.abs(weightSum - 100) <= 1, `${name}: effective weights sum ~100 (got ${weightSum})`);
  }

  const strong = computeScorecard(strongVideo, FIXED_NOW);
  const weak = computeScorecard(weakVideo, FIXED_NOW);
  assert(strong.overallScore > weak.overallScore, "strong beats weak overall");

  // Small audience must not sink good content; high views must not inflate poor work.
  const tiny = computeScorecard(lowViewsGoodContent, FIXED_NOW);
  assert(tiny.categoryScores.engagement !== null, "tiny: engagement is scored");
  assert((tiny.categoryScores.engagement as number) >= 75, "tiny: high ratios score well despite low views");
  assert(tiny.overallScore >= 70, "tiny: good content still scores well");

  const big = computeScorecard(highViewsPoorTranscript, FIXED_NOW);
  assert((big.categoryScores.engagement as number) < 60, "big: weak ratios score low despite high views");
  assert(big.overallScore < strong.overallScore, "big views do not inflate above strong craft");

  // Missing Gemini still yields a complete scorecard, with no Gemini influence.
  const noGem = computeScorecard(strongNoGemini, FIXED_NOW);
  assert(noGem.inputs.geminiUsed === false, "noGemini: geminiUsed false");
  assert(noGem.breakdown.every((b) => !b.geminiInfluenced), "noGemini: nothing gemini-influenced");
  assert(noGem.overallScore > weak.overallScore, "noGemini: still produces a real score");

  // Bounded blend: Gemini cannot swing a category more than maxGeminiDelta (20).
  const injected = computeScorecard(weakWithInjection, FIXED_NOW);
  const base = computeScorecard(weakVideo, FIXED_NOW);
  for (const cat of ["hook", "pacing", "seo"] as const) {
    const a = injected.categoryScores[cat];
    const b = base.categoryScores[cat];
    if (a !== null && b !== null) {
      assert(Math.abs(a - b) <= 20, `injection: ${cat} swing <= 20 (got ${Math.abs(a - b)})`);
    }
  }

  // Short-form: brevity should not crater pacing the way a stub long-form would.
  const short = computeScorecard(shortVideo, FIXED_NOW);
  assert(short.overallScore >= 0 && short.overallScore <= 100, "short: produces a valid score");

  return true;
}
