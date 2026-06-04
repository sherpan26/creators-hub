import type { LandingFeature } from "@/lib/mock/landing";

type FeatureCardProps = {
  feature: LandingFeature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
        {feature.label}
      </p>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
        {feature.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
    </article>
  );
}
