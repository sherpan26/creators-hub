"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type ErrorStateProps = {
  title?: string;
  message: string;
  // Optional secondary link (e.g. back to the reports list on the detail page).
  backHref?: string;
  backLabel?: string;
};

/**
 * Friendly error panel for database/server failures in the reports flow.
 * Mirrors EmptyState's layout but uses a rose accent. "Try Again" re-runs the
 * server component for the current route (the reports pages are force-dynamic,
 * so this re-issues the failed query).
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  backHref,
  backLabel,
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-500/30 bg-slate-900/50 py-20 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-slate-400">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          Try Again
        </button>
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
          >
            {backLabel ?? "Go Back"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
