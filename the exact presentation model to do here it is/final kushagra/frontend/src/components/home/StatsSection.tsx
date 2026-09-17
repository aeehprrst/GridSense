"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Network, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useCountUp } from "@/hooks/useCountUp";
import type { GridState } from "@/lib/types";
import { formatIst } from "@/lib/time";

type Telemetry = { grid: GridState | null; online: boolean; updatedAt: string | null };
type Metric = { value: number | "LIVE" | "SYNC"; suffix: string; label: string; detail: string; icon: typeof Network; online?: boolean };

export function StatsSection() {
  const [telemetry, setTelemetry] = useState<Telemetry>({ grid: null, online: false, updatedAt: null });
  useEffect(() => {
    let active = true;
    const load = async () => {
      const [grid, health] = await Promise.all([api.getGridState(), api.checkHealth()]);
      if (!active) return;
      setTelemetry({ grid, online: ["ok", "healthy", "online"].includes(health.status), updatedAt: `${formatIst().slice(0, -3)} IST` });
    };
    void load();
    const timer = window.setInterval(() => void load(), 45000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const metrics = useMemo<Metric[]>(() => {
    const grid = telemetry.grid;
    const utilization = grid && grid.total_capacity_mw > 0 ? Math.round((grid.total_load_mw / grid.total_capacity_mw) * 100) : 0;
    return [
      { value: grid?.nodes.length ?? 0, suffix: "", label: "Assets monitored", detail: grid ? `${grid.edges.length} active connections` : "Syncing topology", icon: Network },
      { value: grid?.overall_health_pct ?? 0, suffix: "%", label: "Grid health", detail: grid ? "Live resilience index" : "Awaiting telemetry", icon: ShieldCheck },
      { value: utilization, suffix: "%", label: "Capacity in use", detail: grid ? `${Math.round(grid.total_load_mw).toLocaleString()} MW live demand` : "Calculating demand", icon: Activity },
      { value: telemetry.online ? "LIVE" : "SYNC", suffix: "", label: "Intelligence core", detail: telemetry.updatedAt ? `Updated ${telemetry.updatedAt}` : "Connecting to model", icon: Cpu, online: telemetry.online },
    ];
  }, [telemetry]);
  return <section className="gs-impact-section border-y border-gs-border py-20 sm:py-28" aria-labelledby="signal-heading"><div className="container-official"><div className="max-w-2xl"><p className="gs-data-label text-gs-cyan-400">Live grid signal</p><h2 id="signal-heading" className="gs-display mt-3 text-5xl uppercase leading-[.87] text-gs-text-primary sm:text-6xl">Resilience, measured live.</h2><p className="mt-5 max-w-xl text-base leading-relaxed text-gs-text-secondary">GridSense converts connected infrastructure telemetry into a clearer operational picture.</p></div><div className="gs-signal-matrix mt-12 grid gap-px overflow-hidden rounded-xl border border-gs-border bg-gs-border sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">{metrics.map((metric) => <MetricWidget key={metric.label} metric={metric} />)}</div><div className="mt-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-gs-text-muted"><span className={telemetry.online ? "gs-live-dot" : "h-1.5 w-1.5 rounded-full bg-gs-text-muted"} />{telemetry.online ? "Backend telemetry online" : "Local baseline active"}</div></div></section>;
}

function MetricWidget({ metric }: { metric: Metric }) {
  const countTarget = typeof metric.value === "number" ? metric.value : 0;
  const count = useCountUp(countTarget, 900, typeof metric.value === "number");
  const Icon = metric.icon;
  const display = typeof metric.value === "number" ? count : metric.value;
  return <article className="gs-impact-widget group bg-gs-bg-panel p-5 sm:p-6"><div className="flex items-start justify-between"><p className="gs-data-label">{metric.label}</p><Icon className="h-4 w-4 text-gs-cyan-400 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.65} /></div><p className="mt-7 font-mono text-4xl font-bold tracking-[-.08em] text-gs-text-primary sm:text-5xl"><span className="text-gs-cyan-400">{display}</span><span className="ml-1 text-gs-text-secondary">{metric.suffix}</span></p><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-gs-text-secondary">{metric.detail}</p>{metric.online && <span className="gs-widget-status">Live</span>}</div></article>;
}
