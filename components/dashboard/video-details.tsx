"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  extractVideoId,
  fetchYouTubeVideoDetails,
  type YouTubeDetails,
} from "@/lib/youtube";
import { PlayIcon } from "@/components/ui/icons";

type VideoDetailsProps = {
  inputVideoUrl?: string;
  // Optional stored details (e.g. a saved report). When the live fetch hasn't
  // resolved (or fails), these are shown so the panel never blanks out. The
  // dashboard passes none, so it relies purely on the live fetch.
  details?: YouTubeDetails;
  onDetailsResolved?: (details: YouTubeDetails | null) => void;
};

function formatCompact(value?: number | string) {
  if (value == null) return "0";

  let n: number | null = null;
  if (typeof value === "number") n = value;
  else {
    const digits = value.replace(/[^0-9]/g, "");
    n = digits.length === 0 ? null : Number(digits);
  }

  if (n == null || Number.isNaN(n)) return String(value);

  try {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: n >= 1000 ? 1 : 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function VideoDetails({
  inputVideoUrl,
  details: fallbackDetails,
  onDetailsResolved,
}: VideoDetailsProps) {
  const id = inputVideoUrl ? extractVideoId(inputVideoUrl) : null;
  const initialError = inputVideoUrl && !id ? "Invalid YouTube link." : null;

  const [fetched, setFetched] = useState<YouTubeDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(initialError);

  // Kicks off a fetch. Only sets state inside async callbacks (never
  // synchronously in render/effect), so the initial spinner comes from the
  // `loading` initial state above.
  const runFetch = useCallback(
    (videoId: string) => {
      let cancelled = false;
      fetchYouTubeVideoDetails(videoId)
        .then((d) => {
          if (cancelled) return;
          setFetched(d);
          setError(null);
          onDetailsResolved?.(d);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : String(err));
          onDetailsResolved?.(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [onDetailsResolved],
  );

  useEffect(() => {
    if (!id) return;
    return runFetch(id);
  }, [id, runFetch]);

  const handleRetry = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    runFetch(id);
  }, [id, runFetch]);

  // Prefer the live fetch; fall back to any stored details so the panel never
  // blanks (and a failed re-fetch on a saved report still shows the snapshot).
  const shown = fetched ?? fallbackDetails ?? null;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/25">
          <PlayIcon className="h-3.5 w-3.5 translate-x-[1px]" />
        </span>
        <h3 className="text-xl font-semibold text-white">Video Details</h3>
      </div>
      <p className="mt-2 text-sm text-slate-400">Metadata fetched from YouTube.</p>

      {error && !shown ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-rose-400/20 bg-rose-900/20 p-3 text-sm text-rose-200">
            <strong className="block font-semibold">Couldn&apos;t load video details</strong>
            <div className="mt-1">{error}</div>
          </div>
          {id ? (
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : !id && !shown ? (
        <p className="mt-4 text-sm text-slate-400">
          Paste a YouTube URL on the home page to load video details.
        </p>
      ) : loading && !shown ? (
        <div className="mt-4 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-800" />
        </div>
      ) : shown ? (
        <>
          <div className="mt-4 flex gap-4">
            {shown.thumbnailUrl ? (
              <div className="relative h-28 w-48 flex-none overflow-hidden rounded-md">
                <Image
                  src={shown.thumbnailUrl}
                  alt={shown.title}
                  width={192}
                  height={112}
                  className="object-cover"
                />
              </div>
            ) : null}

            <dl className="flex-1 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">Title</dt>
                <dd className="mt-1 text-slate-100">{shown.title}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Channel Name</dt>
                <dd className="mt-1 text-slate-100">{shown.channelName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Views</dt>
                <dd className="mt-1 text-slate-100">{formatCompact(shown.views)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Upload Date</dt>
                <dd className="mt-1 text-slate-100">{shown.uploadDate}</dd>
              </div>
              {inputVideoUrl ? (
                <div>
                  <dt className="text-slate-400">Submitted URL</dt>
                  <dd className="mt-1 break-all text-cyan-200">{inputVideoUrl}</dd>
                </div>
              ) : null}

              <div className="flex items-center gap-4">
                {shown.likeCount !== undefined ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <svg className="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 21s-7-4.35-9-7c-1.43-1.78-1-4 1-5 1.37-.74 3-1 4-3 .98-1.82 3-3 6-3s5.02 1.18 6 3c1 2 2.63 2.26 4 3 2 1 2.43 3.22 1 5-2 2.65-9 7-9 7z" />
                    </svg>
                    <span>{formatCompact(shown.likeCount)}</span>
                  </div>
                ) : null}

                {shown.commentCount !== undefined ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20 2H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
                    </svg>
                    <span>{formatCompact(shown.commentCount)}</span>
                  </div>
                ) : null}
              </div>
            </dl>
          </div>

          <div className="mt-4 flex gap-3">
            {id ? (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                Retry
              </button>
            ) : null}

            {inputVideoUrl ? (
              <a
                href={inputVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                View on YouTube
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
