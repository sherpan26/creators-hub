import Link from "next/link";

export function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/50 py-20 text-center">
      <h3 className="text-xl font-semibold text-white">No Reports Saved Yet</h3>
      <p className="mt-2 text-slate-400">
        Analyzed reports will appear here after you save them.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
      >
        Analyze Your First Video
      </Link>
    </div>
  );
}
