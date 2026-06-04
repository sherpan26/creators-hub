import { AboutSection } from "@/components/landing/about-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroSection } from "@/components/landing/hero-section";
import { Workflow } from "@/components/landing/workflow";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(2,132,199,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(244,63,94,0.12),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />

      <section className="relative mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <HeroSection />
        <Workflow />
        <AboutSection />
        <FeatureGrid />
      </section>
    </main>
  );
}
