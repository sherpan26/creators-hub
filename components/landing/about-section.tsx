export function AboutSection() {
  return (
    <section className="mt-14 grid gap-8 rounded-3xl border border-white/10 bg-slate-900/45 p-6 sm:grid-cols-2 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          Why Creator&apos;s Hub
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Specific guidance beats generic growth advice.
        </h2>
      </div>

      <p className="text-sm leading-7 text-slate-300 sm:text-base">
        Most creators hear the same tips without knowing what to fix first.
        Creator&apos;s Hub analyzes an actual video and returns targeted
        recommendations so you can make your next upload stronger.
      </p>
    </section>
  );
}
