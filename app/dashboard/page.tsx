import { AnalysisFlow } from "@/components/dashboard/analysis-flow";
import { mockAnalysisReport } from "@/lib/mock/dashboard";

type DashboardPageProps = {
  searchParams: Promise<{ videoUrl?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const inputVideoUrl = params.videoUrl;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.95))]" />

      <section className="relative mx-auto max-w-6xl">
        <AnalysisFlow report={mockAnalysisReport} inputVideoUrl={inputVideoUrl} />
      </section>
    </main>
  );
}