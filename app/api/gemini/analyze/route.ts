import type { NextRequest } from "next/server";

type GeminiScoreSuggestion = {
  hook: number;
  pacing: number;
  seo: number;
  overall: number;
};

type GeminiTranscriptFeedback = {
  overallFeedback: string;
  hookAnalysis: string;
  pacingFeedback: string;
  titleThumbnailSuggestions: string;
  topFixes: string[];
  scoreSuggestions: GeminiScoreSuggestion;
};

type GeminiTextPart = {
  text: string;
};

type GeminiContentPart = {
  role?: string;
  parts: GeminiTextPart[];
};

type GeminiCandidate = {
  content?: GeminiContentPart;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

type AnalyzeRequestBody = {
  title?: string;
  channelName?: string;
  description?: string;
  views?: string;
  likes?: number;
  comments?: number;
  transcript?: string;
};

const GEMINI_MODEL = "gemini-2.5-flash";

const emptyFeedback: GeminiTranscriptFeedback = {
  overallFeedback: "",
  hookAnalysis: "",
  pacingFeedback: "",
  titleThumbnailSuggestions: "",
  topFixes: [],
  scoreSuggestions: {
    hook: 0,
    pacing: 0,
    seo: 0,
    overall: 0,
  },
};

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

type RawGeminiFeedback = {
  overallFeedback?: string;
  hookAnalysis?: string;
  pacingFeedback?: string;
  titleThumbnailSuggestions?: string | string[];
  topFixes?: unknown[];
  scoreSuggestions?: Partial<GeminiScoreSuggestion>;
};

function safeParseFeedback(rawText: string): GeminiTranscriptFeedback | null {
  try {
    const cleaned = stripCodeFences(rawText);
    const parsed = JSON.parse(cleaned) as RawGeminiFeedback;

    const titleThumbnailSuggestions =
      typeof parsed.titleThumbnailSuggestions === "string"
        ? parsed.titleThumbnailSuggestions
        : Array.isArray(parsed.titleThumbnailSuggestions)
          ? parsed.titleThumbnailSuggestions.filter((item): item is string => typeof item === "string").join(" ")
          : "";

    return {
      overallFeedback: typeof parsed.overallFeedback === "string" ? parsed.overallFeedback : emptyFeedback.overallFeedback,
      hookAnalysis: typeof parsed.hookAnalysis === "string" ? parsed.hookAnalysis : emptyFeedback.hookAnalysis,
      pacingFeedback: typeof parsed.pacingFeedback === "string" ? parsed.pacingFeedback : emptyFeedback.pacingFeedback,
      titleThumbnailSuggestions,
      topFixes: Array.isArray(parsed.topFixes)
        ? parsed.topFixes.filter((item): item is string => typeof item === "string")
        : emptyFeedback.topFixes,
      scoreSuggestions: {
        hook: typeof parsed.scoreSuggestions?.hook === "number" ? parsed.scoreSuggestions.hook : emptyFeedback.scoreSuggestions.hook,
        pacing: typeof parsed.scoreSuggestions?.pacing === "number" ? parsed.scoreSuggestions.pacing : emptyFeedback.scoreSuggestions.pacing,
        seo: typeof parsed.scoreSuggestions?.seo === "number" ? parsed.scoreSuggestions.seo : emptyFeedback.scoreSuggestions.seo,
        overall: typeof parsed.scoreSuggestions?.overall === "number" ? parsed.scoreSuggestions.overall : emptyFeedback.scoreSuggestions.overall,
      },
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return Response.json({ error: "Missing transcript" }, { status: 400 });
  }

  const prompt = [
    "You are helping a creator improve a YouTube video.",
    "Return ONLY valid JSON. Do not use markdown, code fences, prose, or extra keys.",
    "The JSON must exactly match this shape:",
    '{"overallFeedback":"string","hookAnalysis":"string","pacingFeedback":"string","titleThumbnailSuggestions":"string","topFixes":["string","string","string"],"scoreSuggestions":{"overall":0,"hook":0,"pacing":0,"seo":0}}',
    "Keep feedback short, specific, and beginner-friendly.",
    "Keep all score suggestions as numbers from 0 to 100.",
    "",
    `Video title: ${body.title ?? ""}`,
    `Channel name: ${body.channelName ?? ""}`,
    `Description: ${body.description || "(no description provided)"}`,
    `Views: ${body.views ?? ""}`,
    `Likes: ${body.likes ?? 0}`,
    `Comments: ${body.comments ?? 0}`,
    "",
    "Transcript:",
    transcript,
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
    key,
  )}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    return Response.json(
      { error: "Gemini is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gemini API Error:", response.status, errorBody);

    // Gracefully surface overload/unavailable responses so the client can
    // fall back to local analysis instead of crashing.
    if (response.status === 503) {
      return Response.json(
        { error: "Gemini is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }

    return Response.json(
      { error: `Gemini API error: ${response.status}` },
      { status: response.status },
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return Response.json({ error: "Gemini returned no text" }, { status: 502 });
  }

  const parsed = safeParseFeedback(text);
  if (!parsed) {
    return Response.json({ error: "Gemini returned invalid JSON" }, { status: 502 });
  }

  return Response.json(parsed);
}
