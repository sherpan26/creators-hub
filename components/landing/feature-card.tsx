import type { ComponentType } from "react";
import type { LandingFeature } from "@/lib/mock/landing";
import {
  ScorecardIcon,
  AnalyticsIcon,
  SparkleIcon,
  CommentIcon,
} from "@/components/ui/icons";

type FeatureCardProps = {
  feature: LandingFeature;
};

// Map each feature to a consistent studio icon (falls back to the scorecard).
const FEATURE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Video Scorecard": ScorecardIcon,
  "AI Channel Audit": AnalyticsIcon,
  "Mentor Reviews": SparkleIcon,
  "Creator Community": CommentIcon,
};

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.title] ?? ScorecardIcon;

  return (
    <article className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/20">
          <Icon className="h-5 w-5" />
        </span>
        <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
          {feature.label}
        </p>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
        {feature.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
    </article>
  );
}
