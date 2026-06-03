import { notFound } from "next/navigation";
import { getReportById } from "@/lib/reports/db";
import { ReportDetail } from "@/components/reports/report-detail";

// Always read the latest report from the database (e.g. right after saving).
export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report = await getReportById(id);
  if (!report) {
    notFound();
  }

  return <ReportDetail report={report} />;
}
