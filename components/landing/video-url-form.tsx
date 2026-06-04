"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isValidYouTubeUrl } from "@/lib/validators/youtube";
import { LinkIcon, PlayIcon } from "@/components/ui/icons";

export function VideoUrlForm() {
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUrl = videoUrl.trim();
    if (!normalizedUrl) {
      setError("Please enter a YouTube video URL.");
      return;
    }

    if (!isValidYouTubeUrl(normalizedUrl)) {
      setError("Please enter a valid YouTube link.");
      return;
    }

    setError(null);

    const params = new URLSearchParams({ videoUrl: normalizedUrl });
    router.push(`/dashboard?${params.toString()}`);
  }

  function handleInputChange(value: string) {
    setVideoUrl(value);
    if (error) {
      setError(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 w-full max-w-2xl">
      <label htmlFor="video-url" className="sr-only">
        YouTube video URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="video-url"
            type="text"
            value={videoUrl}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "video-url-error" : undefined}
            className="w-full rounded-xl border border-white/20 bg-slate-950/90 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-12px_rgba(244,63,94,0.8)] transition hover:bg-rose-400"
        >
          <PlayIcon className="h-4 w-4" />
          Analyze Video
        </button>
      </div>

      {error ? (
        <p id="video-url-error" className="mt-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
