"use client";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative bg-gs-bg-primary py-24 overflow-hidden border-t border-gs-border">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,183,211,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(37,183,211,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(37,183,211,0.2) 0%, transparent 60%)",
        }}
      />

      <div className="container-official relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block text-xs font-semibold text-gs-cyan-400 uppercase tracking-widest mb-4">
            Live Grid Explorer
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 text-institutional">
            Explore the National Grid.
          </h2>
          <p className="text-gs-text-secondary text-lg leading-relaxed mb-10">
            Enter our interactive 3D digital twin of India&apos;s electricity network.
            Inspect substations, transformers and transmission corridors,
            powered by live AI predictions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/map-explorer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gs-cyan-500 hover:bg-gs-cyan-400 text-gs-bg-primary font-semibold rounded-md transition-all shadow-lg shadow-gs-cyan-500/25"
            >
              <MapPin className="w-5 h-5" />
              Open Map Explorer
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-gs-border hover:border-gs-cyan-500/50 text-white hover:bg-gs-bg-panel font-medium rounded-md transition-colors"
            >
              View Predictions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
