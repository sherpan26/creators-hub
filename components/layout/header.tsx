import Link from "next/link";
import { PlayIcon, AnalyticsIcon, BookmarkIcon } from "@/components/ui/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/30 transition group-hover:bg-rose-500/25">
            <PlayIcon className="h-4 w-4 translate-x-[1px]" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Creator&apos;s Hub
          </span>
        </Link>

        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <AnalyticsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Analyze</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <BookmarkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
