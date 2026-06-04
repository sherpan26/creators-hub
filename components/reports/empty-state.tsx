import Link from "next/link";
import { BookmarkIcon, PlayIcon } from "@/components/ui/icons";

export function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-900/50 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/20">
        <BookmarkIcon className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-white">No reports saved yet</h3>
      <p className="mt-2 max-w-sm text-slate-400">
        Analyze a video and save it to start tracking scorecards for your uploads.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
      >
        <PlayIcon className="h-4 w-4" />
        Analyze your first video
      </Link>
    </div>
  );
}
