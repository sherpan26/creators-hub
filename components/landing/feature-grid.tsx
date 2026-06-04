import { landingFeatures } from "@/lib/mock/landing";
import { FeatureCard } from "./feature-card";

export function FeatureGrid() {
  return (
    <section className="mt-16" aria-labelledby="features-heading">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Product Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Built for ambitious small creators
          </h2>
        </div>
        <p className="max-w-sm text-sm text-slate-300">
          Start with AI analysis today and grow into channel audits, mentor support,
          and community accountability.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {landingFeatures.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
