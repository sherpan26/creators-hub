import type { TranscriptAnalysis } from "@/lib/transcript";
import type { GeminiTranscriptFeedback } from "@/lib/gemini";

type TranscriptFeedbackProps = {
  analysis: TranscriptAnalysis;
  aiFeedback?: GeminiTranscriptFeedback | null;
  isLoading?: boolean;
  error?: string | null;
  source?: "gemini" | "local";
};

export function TranscriptFeedback({ analysis, aiFeedback, isLoading, error, source }: TranscriptFeedbackProps) {
  const scoreSuggestions = aiFeedback?.scoreSuggestions;
  const feedbackSource = source === "gemini" ? "Gemini" : "Local";
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">Transcript Analysis</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {feedbackSource}
        </span>
      </div>

      {isLoading ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          Generating Gemini feedback...
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          {error} Showing local analysis below.
        </div>
      ) : null}

      {aiFeedback ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Gemini Feedback</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{aiFeedback.overallFeedback}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
              <p className="text-slate-400">Hook analysis</p>
              <p className="mt-1 leading-6">{aiFeedback.hookAnalysis}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
              <p className="text-slate-400">Pacing / structure</p>
              <p className="mt-1 leading-6">{aiFeedback.pacingFeedback}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
              <p className="text-slate-400">Title / thumbnail</p>
              <p className="mt-1 leading-6">{aiFeedback.titleThumbnailSuggestions}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
              <p className="text-slate-400">Top 3 fixes</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-6">
                {aiFeedback.topFixes.map((fix) => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            </div>
          </div>

          {scoreSuggestions ? (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                <p className="text-slate-400">Hook</p>
                <p className="mt-1 text-lg font-semibold text-white">{scoreSuggestions.hook}/100</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                <p className="text-slate-400">Pacing</p>
                <p className="mt-1 text-lg font-semibold text-white">{scoreSuggestions.pacing}/100</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                <p className="text-slate-400">SEO</p>
                <p className="mt-1 text-lg font-semibold text-white">{scoreSuggestions.seo}/100</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                <p className="text-slate-400">Overall</p>
                <p className="mt-1 text-lg font-semibold text-white">{scoreSuggestions.overall}/100</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-white/5 bg-white/3 p-3 text-sm">
          <p className="text-slate-400">Estimated words</p>
          <p className="mt-1 text-lg font-semibold text-white">{analysis.wordCount}</p>
        </div>

        <div className="rounded-md border border-white/5 bg-white/3 p-3 text-sm">
          <p className="text-slate-400">Estimated speaking time</p>
          <p className="mt-1 text-lg font-semibold text-white">{analysis.speakingEstimate}</p>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <p className="text-slate-400">Hook (first 300 chars)</p>
        <blockquote className="mt-2 rounded-md border-l-2 border-cyan-300/30 bg-white/5 p-3 italic text-slate-200">
          {analysis.hookSnippet || "(no transcript provided)"}
        </blockquote>

        <p className="mt-3 text-sm font-medium text-white">Hook feedback</p>
        <p className="mt-1 text-sm text-slate-300">{analysis.hookFeedback}</p>

        <p className="mt-3 text-sm font-medium text-white">Intro length</p>
        <p className="mt-1 text-sm text-slate-300">
          {analysis.introWordCount} words — {analysis.introTooLong ? "Intro looks long" : "Intro length looks fine"}
        </p>

        <p className="mt-3 text-sm font-medium text-white">Structure suggestions</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-300">
          {analysis.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
