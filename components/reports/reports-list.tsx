"use client";

import { useRouter } from "next/navigation";
import { reportsApi, type SavedReport } from "@/lib/reports";
import { ReportCard } from "@/components/reports/report-card";

type ReportsListProps = {
  reports: SavedReport[];
};

export function ReportsList({ reports }: ReportsListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }
    try {
      await reportsApi.deleteReport(id);
      // Re-run the server component so the list reflects the deletion.
      router.refresh();
    } catch (error) {
      console.error("Failed to delete report:", error);
    }
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onDelete={handleDelete} />
      ))}
    </div>
  );
}
