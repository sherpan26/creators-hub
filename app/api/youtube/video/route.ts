import type { NextRequest } from "next/server";

function formatNumber(value?: string) {
  if (!value) return "0";
  try {
    return new Intl.NumberFormat("en-US").format(Number(value));
  } catch {
    return value;
  }
}

export async function GET(request: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return Response.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  }

  const id = request.nextUrl.searchParams.get("videoId");
  if (!id) {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(
    id,
  )}&key=${encodeURIComponent(key)}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return Response.json({ error: "Failed to reach YouTube API" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json(
      { error: `YouTube API error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  const item = data.items[0];
  const snippet = item.snippet || {};
  const stats = item.statistics || {};

  const details = {
    title: snippet.title || "(no title)",
    views: formatNumber(stats.viewCount),
    uploadDate: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : "",
    channelName: snippet.channelTitle || "",
    thumbnailUrl: (snippet.thumbnails && (snippet.thumbnails.high || snippet.thumbnails.default))?.url,
    description: snippet.description || "",
    likeCount: stats.likeCount ? Number(stats.likeCount) : undefined,
    commentCount: stats.commentCount ? Number(stats.commentCount) : undefined,
  };

  return Response.json(details);
}
