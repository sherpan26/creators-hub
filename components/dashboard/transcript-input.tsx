"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeTranscript, type TranscriptAnalysis } from "@/lib/transcript";
import {
  generateGeminiTranscriptFeedback,
  type GeminiTranscriptFeedback,
} from "@/lib/gemini";
import type { VideoDetails as VideoDetailsType } from "@/lib/youtube";
import { reportsApi, type NewReportInput } from "@/lib/reports";
import { TranscriptFeedback } from "./transcript-feedback";

type TranscriptInputProps = {
  videoDetails?: VideoDetailsType;
  youtubeUrl: string;
};

type SaveStatus = "idle" | "saving" | "success" | "error" | "duplicate";

export function TranscriptInput({
  videoDetails,
  youtubeUrl,
}: TranscriptInputProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [aiFeedback, setAiFeedback] = useState<GeminiTranscriptFeedback | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [source, setSource] = useState<"gemini" | "local">("local");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAnalyze() {
    setError(null);
    setAiError(null);
    setSaveStatus("idle");
    const t = text.trim();
    if (!t) {
      setError("Please paste a transcript before analyzing.");
      return;
    }

    try {
      const result = analyzeTranscript(t);
      setAnalysis(result);
      setAiFeedback(null);
      setSource("local");

      const details = videoDetails;
      if (!details) {
        return;
      }

      setLoading(true);
      const gemini = await generateGeminiTranscriptFeedback({
        title: details.title,
        channelName: details.channelName,
        description: details.description || "",
        views: details.views,
        likes: details.likeCount,
        comments: details.commentCount,
        transcript: t,
      });
      setAiFeedback(gemini);
      setSource("gemini");
    } catch {
      if (videoDetails) {
        setAiError("Gemini feedback failed. Showing local analysis instead.");
        setSource("local");
      } else {
        setError("Failed to analyze transcript.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveReport() {
    if (!analysis || !videoDetails) return;
    setSaveStatus("saving");
    setSaveError(null);

    // The database generates id and createdAt, so we only send a NewReportInput.
    const input: NewReportInput = {
      youtubeUrl,
      source,
      videoDetails: {
        ...videoDetails,
        uploadDate: videoDetails.uploadDate || new Date().toISOString(),
      },
      transcriptAnalysis: analysis,
      geminiFeedback: aiFeedback,
      transcriptText: text,
    };

    const result = await reportsApi.saveReport(input);

    if (result.success) {
      setSaveStatus("success");
      setTimeout(() => {
        if (result.report) {
          router.push(`/reports/${result.report.id}`);
        }
      }, 750);
    } else if (result.duplicate) {
      setSaveStatus("duplicate");
      setSaveError(result.error || "This report has already been saved.");
    } else {
      setSaveStatus("error");
      setSaveError(result.error || "Could not save report. Please try again.");
    }
  }

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "success":
        return "Saved!";
      case "duplicate":
        return "Already Saved";
      case "error":
        return "Save Failed";
      default:
        return "Save Report";
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <h3 className="text-xl font-semibold text-white">Transcript</h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste transcript or script here..."
        rows={8}
        className="mt-4 w-full rounded-md border border-white/10 bg-slate-800/60 p-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
      />

      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      {aiError ? (
        <p className="mt-2 text-sm text-amber-300">{aiError}</p>
      ) : null}
      {saveError && saveStatus === "error" ? (
        <p className="mt-2 text-sm text-rose-300">{saveError}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze Transcript"}
        </button>

        <button
          type="button"
          onClick={() => {
            setText("");
            setAnalysis(null);
            setAiFeedback(null);
            setError(null);
            setAiError(null);
            setLoading(false);
            setSource("local");
            setSaveStatus("idle");
          }}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
        >
          Clear
        </button>

        {analysis && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveReport}
              disabled={saveStatus === "saving" || saveStatus === "success"}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                saveStatus === "success"
                  ? "bg-green-500"
                  : saveStatus === "duplicate"
                    ? "bg-amber-500"
                    : saveStatus === "error"
                      ? "bg-rose-500"
                      : "bg-blue-500 hover:bg-blue-400"
              } disabled:cursor-not-allowed disabled:opacity-80`}
            >
              {getSaveButtonText()}
            </button>
            {saveStatus === "duplicate" && (
              <p className="text-sm text-amber-300">
                This report is already saved.
              </p>
            )}
          </div>
        )}
      </div>

      {analysis ? (
        <div className="mt-6">
          <TranscriptFeedback
            analysis={analysis}
            aiFeedback={aiFeedback}
            isLoading={loading}
            error={aiError}
            source={source}
          />
        </div>
      ) : null}
    </section>
  );
}

