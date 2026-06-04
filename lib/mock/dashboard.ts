export type ScoreItem = {
  label:
    | "Overall Score"
    | "Hook"
    | "Title"
    | "Thumbnail"
    | "Pacing"
    | "SEO"
    | "Audience Response";
  value: number;
  max: number;
  note: string;
};

export type CreatorFix = {
  title: string;
  detail: string;
};

export type VideoDetails = {
  title: string;
  views: string;
  uploadDate: string;
  channelName: string;
  description?: string;
  likeCount?: number;
  commentCount?: number;
};

export type AnalysisReport = {
  scores: ScoreItem[];
  topFixes: CreatorFix[];
  aiFeedback: string[];
  videoDetails: VideoDetails;
};

export const mockAnalysisReport: AnalysisReport = {
  scores: [
    {
      label: "Overall Score",
      value: 74,
      max: 100,
      note: "Strong educational value, but weak opening retention.",
    },
    {
      label: "Hook",
      value: 6,
      max: 10,
      note: "Main promise appears too late in the first 20 seconds.",
    },
    {
      label: "Title",
      value: 7,
      max: 10,
      note: "Clear topic, but the result statement can be sharper.",
    },
    {
      label: "Thumbnail",
      value: 8,
      max: 10,
      note: "Good contrast and readable text at mobile size.",
    },
    {
      label: "Pacing",
      value: 6,
      max: 10,
      note: "Several sections run long without visual changes.",
    },
    {
      label: "SEO",
      value: 8,
      max: 10,
      note: "Good keyword match between title and description.",
    },
    {
      label: "Audience Response",
      value: 7,
      max: 10,
      note: "Likely useful comments, but shareability can improve.",
    },
  ],
  topFixes: [
    {
      title: "Open with the result in the first 8 seconds",
      detail:
        "Lead with the transformation viewers care about, then quickly preview the steps.",
    },
    {
      title: "Refactor the title around one clear benefit",
      detail:
        "Swap broad wording for a specific promise that includes timeframe or outcome.",
    },
    {
      title: "Increase pacing with visual pattern interrupts",
      detail:
        "Add cutaways, captions, or B-roll every 4-6 seconds in slower segments.",
    },
  ],
  aiFeedback: [
    "Your topic selection is strong and aligned with searchable creator intent.",
    "Retention likely drops at the transition from intro to explanation because the narrative energy dips.",
    "Use one recurring phrase in title, first 30 seconds, and description to improve relevance consistency.",
    "A stronger final call-to-action can lift comments and return viewers for part-two content.",
  ],
  videoDetails: {
    title: "I Tried YouTube Shorts for 30 Days - What Actually Happened",
    views: "12,483",
    uploadDate: "May 14, 2026",
    channelName: "Growth Lab with Nima",
  },
};
