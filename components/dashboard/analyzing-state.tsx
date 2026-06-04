"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  PlayIcon,
  TranscriptIcon,
  TagIcon,
  TargetIcon,
  ScorecardIcon,
  CheckIcon,
} from "@/components/ui/icons";

// Steps mirror the real pipeline: fetch metadata, read the pasted transcript,
// review packaging (title/description — not the thumbnail image), score
// hook/pacing, then assemble the scorecard. Shown only while analysis runs.
const ANALYSIS_STEPS: { label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { label: "Fetching video details", Icon: PlayIcon },
  { label: "Reading transcript", Icon: TranscriptIcon },
  { label: "Reviewing video packaging", Icon: TagIcon },
  { label: "Scoring hook and pacing", Icon: TargetIcon },
  { label: "Preparing creator scorecard", Icon: ScorecardIcon },
];

export function AnalyzingState() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const progress = useMemo(
    () => Math.round(((activeStepIndex + 1) / ANALYSIS_STEPS.length) * 100),
    [activeStepIndex],
  );
  const elapsedSeconds = useMemo(() => (elapsedMs / 1000).toFixed(1), [elapsedMs]);

  useEffect(() => {
    // Advance through the steps while the real request is in flight, holding on
    // the last step until the parent unmounts this on completion.
    const stepTimer = window.setInterval(() => {
      setActiveStepIndex((current) =>
        current >= ANALYSIS_STEPS.length - 1 ? current : current + 1,
      );
    }, 600);
    const elapsedTimer = window.setInterval(() => {
      setElapsedMs((current) => current + 100);
    }, 100);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(elapsedTimer);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
        <span className="grid h-5 w-5 place-items-center rounded bg-rose-500/15 text-rose-400">
          <PlayIcon className="h-2.5 w-2.5 translate-x-[0.5px]" />
        </span>
        Analysis pipeline
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Building your creator scorecard…
      </h2>
      <p className="mt-3 text-sm text-slate-300">
        Combining your video metadata and transcript with AI/local feedback.
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
        <span>Elapsed: {elapsedSeconds}s</span>
        <span>{progress}%</span>
      </div>

      <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      <ul className="mt-6 space-y-3 text-sm">
        {ANALYSIS_STEPS.map((step, index) => {
          const isDone = index < activeStepIndex;
          const isActive = index === activeStepIndex;
          const Icon = step.Icon;

          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                isDone
                  ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                  : isActive
                    ? "border-cyan-300/30 bg-cyan-300/5 text-cyan-50"
                    : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {isDone ? (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-300/20 text-cyan-200">
                  <CheckIcon className="h-4 w-4" />
                </span>
              ) : isActive ? (
                <span className="relative grid h-6 w-6 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/20" />
                  <span className="relative grid h-6 w-6 place-items-center rounded-full bg-cyan-300/15 text-cyan-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </span>
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/5 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              )}

              <span>{step.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
