export type GeminiScoreSuggestion = {
  hook: number;
  pacing: number;
  seo: number;
  overall: number;
};

export type GeminiTranscriptFeedback = {
  overallFeedback: string;
  hookAnalysis: string;
  pacingFeedback: string;
  titleThumbnailSuggestions: string;
  topFixes: string[];
  scoreSuggestions: GeminiScoreSuggestion;
};

export async function generateGeminiTranscriptFeedback(input: {
  title: string;
  channelName: string;
  description: string;
  views: string;
  likes?: number;
  comments?: number;
  transcript: string;
}): Promise<GeminiTranscriptFeedback> {
  const response = await fetch("/api/gemini/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Gemini API error: ${response.status}`);
  }

  return data as GeminiTranscriptFeedback;
}
