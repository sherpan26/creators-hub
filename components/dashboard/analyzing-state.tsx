"use client";

import { useEffect, useMemo, useState } from "react";

// Steps reflect the real pipeline: fetch metadata, read the pasted transcript,
// review packaging (title/description — not the thumbnail image), score
// hook/pacing, then assemble the scorecard. Shown only while real analysis runs.
const ANALYSIS_STEPS = [
  "Fetching video details",
  "Reading transcript",
  "Reviewing video packaging",
  "Scoring hook and pacing",
  "Preparing creator scorecard",
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
        Analyzing transcript
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
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
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
