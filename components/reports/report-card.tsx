"use client";

import Image from "next/image";
import Link from "next/link";
import type { SavedReport } from "@/lib/reports";

type ReportCardProps = {
  report: SavedReport;
  onDelete: (id: string) => void;
};

export function ReportCard({ report, onDelete }: ReportCardProps) {
  const thumbnailUrl = report.videoDetails.thumbnailUrl;

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/50">
      {thumbnailUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-t-2xl">
          <Image
            src={thumbnailUrl}
            alt={report.videoDetails.title}
            layout="fill"
            objectFit="cover"
          />
        </div>
      ) : (
        <div className="h-40 w-full rounded-t-2xl bg-slate-800" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
        <h3 className="mt-2 flex-1 font-semibold text-white">
          {report.videoDetails.title}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          {report.videoDetails.channelName}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              report.source === "gemini"
                ? "bg-cyan-300/10 text-cyan-200"
                : "bg-slate-300/10 text-slate-200"
            }`}
          >
            {report.source}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/reports/${report.id}`}
              className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => onDelete(report.id)}
              className="rounded-lg bg-rose-500/10 px-3 py-1 text-sm text-rose-300 transition hover:bg-rose-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
