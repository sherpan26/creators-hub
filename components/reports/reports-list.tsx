"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportsApi, type SavedReport } from "@/lib/reports";
import { ReportCard } from "@/components/reports/report-card";

type ReportsListProps = {
  reports: SavedReport[];
};

export function ReportsList({ reports }: ReportsListProps) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }
    setDeleteError(null);
    try {
      await reportsApi.deleteReport(id);
      // Re-run the server component so the list reflects the deletion.
      router.refresh();
    } catch (error) {
      // A failed delete should inform the user, not crash the list.
      console.error("Failed to delete report:", error);
      setDeleteError("Could not delete report. Please try again.");
    }
  }

  return (
    <>
      {deleteError ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {deleteError}
        </p>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
