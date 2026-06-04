const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function isValidYouTubeUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    if (!(parsed.protocol === "https:" || parsed.protocol === "http:")) {
      return false;
    }

    if (!YOUTUBE_HOSTS.has(parsed.hostname)) {
      return false;
    }

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.length > 1;
    }

    const hasWatchId = parsed.pathname === "/watch" && parsed.searchParams.has("v");
    const isShorts = parsed.pathname.startsWith("/shorts/");
    const isEmbed = parsed.pathname.startsWith("/embed/");

    return hasWatchId || isShorts || isEmbed;
  } catch {
    return false;
  }
}
