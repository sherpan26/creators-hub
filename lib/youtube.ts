export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split(/[/?#]/)[0];
      return id || null;
    }

    if (host === "youtube.com" || host.endsWith("youtube.com") || host === "m.youtube.com") {
      // watch?v=ID
      if (parsed.searchParams.has("v")) {
        return parsed.searchParams.get("v");
      }

      // shorts/ID
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) return parts[1];

      // embed/ID
      if (parts[0] === "embed" && parts[1]) return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

export interface YouTubeDetails {
  title: string;
  views: string;
  uploadDate: string;
  channelName: string;
  thumbnailUrl?: string;
  description?: string;
  likeCount?: number;
  commentCount?: number;
}

export type VideoDetails = YouTubeDetails;

export async function fetchYouTubeVideoDetails(id: string): Promise<YouTubeDetails> {
  const res = await fetch(`/api/youtube/video?videoId=${encodeURIComponent(id)}`);

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `YouTube API error: ${res.status}`);
  }

  return data as YouTubeDetails;
}
