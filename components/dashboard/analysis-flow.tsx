"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisReport } from "@/lib/mock/dashboard";
import { AnalyzingState } from "./analyzing-state";
import { DashboardReport } from "./dashboard-report";

type AnalysisFlowProps = {
  report: AnalysisReport;
  inputVideoUrl?: string;
};

export function AnalysisFlow({ report, inputVideoUrl }: AnalysisFlowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleComplete = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    const transitionTimer = window.setTimeout(() => {
      setIsLoading(false);
      setIsTransitioning(false);
    }, 350);

    return () => {
      window.clearTimeout(transitionTimer);
    };
  }, [isTransitioning]);

  return (
    <div className="relative">
      {isLoading ? (
        <div
          className={`transition-all duration-300 ${
            isTransitioning
              ? "pointer-events-none -translate-y-1 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <AnalyzingState onComplete={handleComplete} />
        </div>
      ) : null}

      <div
        className={`${isLoading ? "absolute inset-0" : ""} transition-all duration-500 ${
          isTransitioning || !isLoading
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <DashboardReport report={report} inputVideoUrl={inputVideoUrl} />
      </div>
    </div>
  );
}
