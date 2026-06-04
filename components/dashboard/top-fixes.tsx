import type { CreatorFix } from "@/lib/mock/dashboard";

type TopFixesProps = {
  fixes: CreatorFix[];
};

export function TopFixes({ fixes }: TopFixesProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <h3 className="text-xl font-semibold text-white">Top 3 Recommended Fixes</h3>
      <ol className="mt-5 space-y-4 text-sm text-slate-300">
        {fixes.map((fix, index) => (
          <li key={fix.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-cyan-200">
              {index + 1}. {fix.title}
            </p>
            <p className="mt-2 leading-6">{fix.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
