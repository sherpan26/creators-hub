"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isValidYouTubeUrl } from "@/lib/validators/youtube";

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
        <input
          id="video-url"
          type="text"
          value={videoUrl}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "video-url-error" : undefined}
          className="flex-1 rounded-xl border border-white/20 bg-slate-950/90 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
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
