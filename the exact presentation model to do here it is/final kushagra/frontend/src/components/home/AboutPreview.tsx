"use client";
import Link from "next/link";
import { ArrowRight, Network } from "lucide-react";

export function AboutPreview() {
  const items = [
    "Machine Learning",
    "Graph Neural Networks",
    "Grid Simulation",
    "Risk Prediction",
    "Root Cause Analysis",
    "Cascade Prediction",
  ];

  return (
    <section className="bg-gs-bg-secondary py-24 border-y border-gs-border">
      <div className="container-official">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-gs-bg-panel to-gs-bg-elevated border border-gs-border">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(37,183,211,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(37,183,211,0.15) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="relative inline-block">
                  <Network className="w-24 h-24 text-gs-cyan-400 mx-auto mb-4" />
                  <div className="absolute inset-0 rounded-full bg-gs-cyan-500/10 blur-2xl" />
                </div>
                <div className="text-gs-text-tertiary text-xs font-mono uppercase tracking-widest">
                  Digital Grid Twin
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="inline-block text-xs font-semibold text-gs-cyan-400 uppercase tracking-widest mb-4">
              About GridSense
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight text-institutional">
              Intelligence for the<br />national grid.
            </h2>
            <p className="text-gs-text-secondary leading-relaxed mb-6">
              GridSense is an AI-powered grid intelligence platform designed to
              help electricity infrastructure operators understand, predict, and
              mitigate potential grid failures before they escalate into
              large-scale outages.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {items.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-gs-text-secondary"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gs-cyan-500" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gs-bg-panel hover:bg-gs-bg-elevated border border-gs-border hover:border-gs-cyan-500/50 text-white text-sm font-medium rounded-md transition-colors"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}