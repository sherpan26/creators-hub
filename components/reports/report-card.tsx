"use client";

import Image from "next/image";
import Link from "next/link";
import type { SavedReport } from "@/lib/reports";
import { ratingChipClass } from "@/components/ui/rating";
import {
  PlayIcon,
  ChannelIcon,
  ClockIcon,
  TrashIcon,
  SparkleIcon,
} from "@/components/ui/icons";

type ReportCardProps = {
  report: SavedReport;
  onDelete: (id: string) => void;
};

export function ReportCard({ report, onDelete }: ReportCardProps) {
  const thumbnailUrl = report.videoDetails.thumbnailUrl;
  const overall = report.scorecard?.overallScore ?? null;
  const rating = report.scorecard?.ratingLabel ?? null;
  const isGemini = report.source === "gemini";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 transition hover:border-white/20 hover:bg-slate-900">
      <div className="relative h-40 w-full overflow-hidden bg-slate-800">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={report.videoDetails.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-600">
            <PlayIcon className="h-10 w-10" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Play affordance */}
        <span className="pointer-events-none absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-rose-500/90 text-white shadow-lg">
          <PlayIcon className="h-4 w-4 translate-x-[1px]" />
        </span>

        {/* Overall score badge (when scored) */}
        {overall !== null ? (
          <span className={`absolute right-3 top-3 ${ratingChipClass(rating)}`}>
            {overall}
            <span className="ml-1 font-normal opacity-70">{rating}</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5" />
            {new Date(report.createdAt).toLocaleDateString()}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
              isGemini
                ? "bg-cyan-300/10 text-cyan-200 ring-cyan-300/20"
                : "bg-slate-400/10 text-slate-300 ring-slate-400/20"
            }`}
          >
            {isGemini ? <SparkleIcon className="h-3 w-3" /> : null}
            {report.source}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 flex-1 font-semibold text-white">
          {report.videoDetails.title}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-300">
          <ChannelIcon className="h-3.5 w-3.5 text-slate-500" />
          {report.videoDetails.channelName}
        </p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Link
            href={`/reports/${report.id}`}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            View report
          </Link>
          <button
            type="button"
            onClick={() => onDelete(report.id)}
            aria-label="Delete report"
            className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
