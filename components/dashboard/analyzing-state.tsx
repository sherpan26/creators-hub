"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyzingStateProps = {
  onComplete: () => void;
};

const ANALYSIS_STEPS = [
  "Fetching video details",
  "Reading transcript",
  "Checking thumbnail",
  "Scoring hook and pacing",
  "Generating creator scorecard",
];

export function AnalyzingState({ onComplete }: AnalyzingStateProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const progress = useMemo(
    () => (isComplete ? 100 : Math.round(((activeStepIndex + 1) / ANALYSIS_STEPS.length) * 100)),
    [activeStepIndex, isComplete],
  );

  const elapsedSeconds = useMemo(() => (elapsedMs / 1000).toFixed(1), [elapsedMs]);

  useEffect(() => {
    let handoffTimer: number | undefined;

    const stepTimer = window.setInterval(() => {
      setActiveStepIndex((current) => {
        if (current >= ANALYSIS_STEPS.length - 1) {
          return current;
        }

        return current + 1;
      });
    }, 450);

    const elapsedTimer = window.setInterval(() => {
      setElapsedMs((current) => current + 100);
    }, 100);

    const completeTimer = window.setTimeout(() => {
      window.clearInterval(stepTimer);
      window.clearInterval(elapsedTimer);
      setActiveStepIndex(ANALYSIS_STEPS.length - 1);
      setIsComplete(true);

      handoffTimer = window.setTimeout(() => {
        onComplete();
      }, 300);
    }, 2500);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(elapsedTimer);
      window.clearTimeout(completeTimer);
      if (handoffTimer) {
        window.clearTimeout(handoffTimer);
      }
    };
  }, [onComplete]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
        {isComplete ? "Analysis Complete" : "Analyzing Video"}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {isComplete
          ? "Creator scorecard generated"
          : "Building your creator scorecard..."}
      </h2>
      <p className="mt-3 text-sm text-slate-300">
        {isComplete
          ? "Finalizing your report and preparing dashboard insights."
          : "This is a mock frontend-only analysis to simulate real AI processing."}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
        <span>Elapsed: {elapsedSeconds}s</span>
        <span>{progress}% complete</span>
      </div>

      <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <span
          aria-hidden
          className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px] transition-all duration-500 ease-out ${
            isComplete ? "translate-x-[320%] opacity-100" : "-translate-x-[140%] opacity-0"
          }`}
        />
      </div>

      <ul className="mt-6 space-y-3 text-sm">
        {ANALYSIS_STEPS.map((step, index) => {
          const isDone = isComplete || index < activeStepIndex;
          const isActive = !isComplete && index === activeStepIndex;

          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                isDone
                  ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                  : isActive
                    ? "border-cyan-300/30 bg-cyan-300/5 text-cyan-50"
                    : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {isDone ? (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-300/20 text-cyan-200">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 011.414-1.414l2.543 2.543 6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : isActive ? (
                <span className="relative h-5 w-5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/30" />
                  <span className="absolute inset-[3px] rounded-full bg-cyan-200" />
                </span>
              ) : (
                <span className="h-5 w-5 rounded-full border border-slate-600" />
              )}

              <span>{step}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
