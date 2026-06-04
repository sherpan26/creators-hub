export type TranscriptAnalysis = {
  wordCount: number;
  speakingSeconds: number;
  speakingEstimate: string; // mm:ss
  hookSnippet: string;
  hookFeedback: string;
  introWordCount: number;
  introTooLong: boolean;
  paragraphCount: number;
  timestampsFound: boolean;
  suggestions: string[];
};

function toMMSS(sec: number) {
  const s = Math.round(sec);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export function analyzeTranscript(text: string): TranscriptAnalysis {
  const cleaned = (text || "").trim();
  const words = cleaned.match(/\b\w+\b/g) || [];
  const wordCount = words.length;

  // speaking at ~130 words per minute
  const speakingSeconds = wordCount / (130 / 60);

  const speakingEstimate = toMMSS(speakingSeconds);

  const hookSnippet = cleaned.slice(0, 300);

  const hookLower = hookSnippet.toLowerCase();
  let hookFeedback = "The intro is direct and attention-grabbing.";
  if (hookSnippet.length < 40) {
    hookFeedback = "Hook looks short — try opening with a stronger, clearer promise.";
  } else if (
    !/(you|how to|learn|want to|discover|transform|result|in this video)/i.test(hookLower)
  ) {
    hookFeedback = "Consider adding a clearer promise in the first sentence (what the viewer will get).";
  }

  // intro length: first paragraph or first 150 words
  const firstParagraph = cleaned.split(/\n\n+/)[0] || "";
  const introWords = (firstParagraph.match(/\b\w+\b/g) || []).length;
  const introTooLong = introWords > 60;

  const paragraphs = cleaned.split(/\n\n+/).filter(Boolean);
  const paragraphCount = paragraphs.length;

  const timestampsFound = /\d{1,2}:\d{2}/.test(text);

  const suggestions: string[] = [];
  if (introTooLong) suggestions.push("Intro may be long — try to make the first 20-30 seconds punchier.");
  if (paragraphCount < 3) suggestions.push("Break the transcript into clear sections or timestamps for readability.");
  if (!timestampsFound) suggestions.push("Consider adding timestamps for key sections to improve navigation.");
  if (wordCount > 2000) suggestions.push("Long transcript — consider splitting into chapters or a short summary.");
  if (suggestions.length === 0) suggestions.push("Structure looks reasonable — consider adding visual cues and timestamps.");

  return {
    wordCount,
    speakingSeconds,
    speakingEstimate,
    hookSnippet,
    hookFeedback,
    introWordCount: introWords,
    introTooLong,
    paragraphCount,
    timestampsFound,
    suggestions,
  };
}

