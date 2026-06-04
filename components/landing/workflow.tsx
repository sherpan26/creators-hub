import { Fragment } from "react";
import {
  LinkIcon,
  TranscriptIcon,
  ScorecardIcon,
  BookmarkIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

const STEPS = [
  { Icon: LinkIcon, title: "YouTube URL", desc: "Paste a video link", accent: "text-rose-400 bg-rose-500/10 ring-rose-500/25" },
  { Icon: TranscriptIcon, title: "Transcript", desc: "Add your script", accent: "text-sky-300 bg-sky-500/10 ring-sky-500/25" },
  { Icon: ScorecardIcon, title: "Scorecard", desc: "AI + heuristics", accent: "text-cyan-300 bg-cyan-300/10 ring-cyan-300/25" },
  { Icon: BookmarkIcon, title: "Saved Report", desc: "Track each upload", accent: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/25" },
];

export function Workflow() {
  return (
    <section className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
        Video review workflow
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {STEPS.map((step, index) => (
          <Fragment key={step.title}>
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <span
                className={`grid h-10 w-10 flex-none place-items-center rounded-xl ring-1 ring-inset ${step.accent}`}
              >
                <step.Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Step {index + 1}
                </p>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-slate-400">{step.desc}</p>
              </div>
            </div>
            {index < STEPS.length - 1 ? (
              <ArrowRightIcon className="mx-auto h-5 w-5 rotate-90 text-slate-600 sm:rotate-0" />
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
