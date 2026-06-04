"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { VideoDetails as VideoDetailsType } from "@/lib/mock/dashboard";
import { extractVideoId, fetchYouTubeVideoDetails, type YouTubeDetails } from "@/lib/youtube";

type VideoDetailsProps = {
  details: VideoDetailsType;
  inputVideoUrl?: string;
  onDetailsResolved?: (details: YouTubeDetails | null) => void;
};

export function VideoDetails({ details, inputVideoUrl, onDetailsResolved }: VideoDetailsProps) {
  const id = inputVideoUrl ? extractVideoId(inputVideoUrl) : null;
  const initialError = inputVideoUrl && !id ? "Invalid YouTube link" : null;

  const [remote, setRemote] = useState<VideoDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function fetchData(scheduleInitial = true) {
    if (!id) return;
    let cancelled = false;

    const startTimer = scheduleInitial
      ? window.setTimeout(() => {
          if (cancelled) return;
          setLoading(true);
          setError(null);
        }, 0)
      : undefined;

    try {
      const d = await fetchYouTubeVideoDetails(id);
      if (cancelled) return;
      setRemote(d as VideoDetailsType);
      onDetailsResolved?.(d);
    } catch (err: unknown) {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : String(err));
      onDetailsResolved?.(null);
    } finally {
      if (!cancelled) setLoading(false);
      if (startTimer) window.clearTimeout(startTimer);
    }

    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    if (!id) return;

    let cleanupFn: void | (() => void);
    const starter = window.setTimeout(() => {
      const maybe = fetchData(true);
      cleanupFn = maybe as unknown as () => void;
    }, 0);

    return () => {
      window.clearTimeout(starter);
      if (typeof cleanupFn === "function") cleanupFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleRetry() {
    // user-initiated retry, no scheduling
    fetchData(false);
  }

  const show = remote ?? details;
  const remoteExtra = (remote ?? null) as unknown as {
    thumbnailUrl?: string;
    likeCount?: number;
    commentCount?: number;
    description?: string;
  };

  function formatCompact(value?: number | string) {
    if (value == null) return "0";

    let n: number | null = null;
    if (typeof value === "number") n = value;
    else if (typeof value === "string") {
      const digits = value.replace(/[^0-9]/g, "");
      if (digits.length === 0) n = null;
      else n = Number(digits);
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

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <h3 className="text-xl font-semibold text-white">Video Details</h3>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-800" />
        </div>
      ) : (
        <>
          {error ? (
            <div className="mt-4 rounded-md border border-rose-400/20 bg-rose-900/20 p-3 text-sm text-rose-200">
              <strong className="block font-semibold">Error</strong>
              <div className="mt-1">{error}</div>
              <div className="mt-2 text-xs text-slate-300">Showing fallback mock details below.</div>
            </div>
          ) : null}

          <div className="mt-4 flex gap-4">
            {/** Thumbnail */}
            {remoteExtra?.thumbnailUrl ? (
              <div className="relative h-28 w-48 flex-none overflow-hidden rounded-md">
                <Image
                  src={remoteExtra.thumbnailUrl}
                  alt={show.title}
                  width={192}
                  height={112}
                  className="object-cover"
                />
              </div>
            ) : null}

            <dl className="flex-1 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">Title</dt>
                <dd className="mt-1 text-slate-100">{show.title}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Channel Name</dt>
                <dd className="mt-1 text-slate-100">{show.channelName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Views</dt>
                <dd className="mt-1 text-slate-100">{formatCompact(show.views)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Upload Date</dt>
                <dd className="mt-1 text-slate-100">{show.uploadDate}</dd>
              </div>
              {inputVideoUrl ? (
                <div>
                  <dt className="text-slate-400">Submitted URL</dt>
                  <dd className="mt-1 break-all text-cyan-200">{inputVideoUrl}</dd>
                </div>
              ) : null}

              <div className="flex items-center gap-4">
                {remoteExtra?.likeCount !== undefined ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <svg className="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 21s-7-4.35-9-7c-1.43-1.78-1-4 1-5 1.37-.74 3-1 4-3 .98-1.82 3-3 6-3s5.02 1.18 6 3c1 2 2.63 2.26 4 3 2 1 2.43 3.22 1 5-2 2.65-9 7-9 7z" />
                    </svg>
                    <span>{formatCompact(remoteExtra.likeCount)}</span>
                  </div>
                ) : null}

                {remoteExtra?.commentCount !== undefined ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20 2H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
                    </svg>
                    <span>{formatCompact(remoteExtra.commentCount)}</span>
                  </div>
                ) : null}
              </div>
            </dl>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
            >
              Retry
            </button>

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

            <button
              type="button"
              className="ml-auto rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Request Mentor Review
            </button>
          </div>
        </>
      )}
    </section>
  );
}
