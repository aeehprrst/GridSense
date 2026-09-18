"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PlantHistoryPoint } from "@/lib/plantTelemetry";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Legend, Tooltip);

/**
 * Brush sensor trend: temperature and vibration on the left axis, health score
 * on the right. Same three series, colours and dual-axis layout as the Chart.js
 * block in the retired dashboard.html.
 */
export function SensorTrendChart({ history }: { history: PlantHistoryPoint[] }) {
  const data = useMemo<ChartData<"line">>(
    () => ({
      labels: history.map((point) => point.label),
      datasets: [
        {
          label: "Temperature (°C)",
          data: history.map((point) => point.temperature),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.10)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: "y1",
        },
        {
          label: "Vibration (mm/s ×10)",
          data: history.map((point) => point.vibration),
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.10)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: "y1",
        },
        {
          label: "Health Score (%)",
          data: history.map((point) => point.health),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.10)",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: "y2",
        },
      ],
    }),
    [history]
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 12 } },
        tooltip: { backgroundColor: "#0f172a", borderColor: "#1e293b", borderWidth: 1 },
      },
      scales: {
        x: {
          ticks: { color: "#475569", font: { size: 10 }, maxTicksLimit: 8 },
          grid: { color: "#1e293b" },
        },
        y1: {
          position: "left",
          ticks: { color: "#94a3b8", font: { size: 10 } },
          grid: { color: "#1e293b" },
          title: { display: true, text: "Sensor value", color: "#475569" },
        },
        y2: {
          position: "right",
          min: 0,
          max: 100,
          ticks: { color: "#22c55e", font: { size: 10 } },
          grid: { display: false },
          title: { display: true, text: "Health %", color: "#22c55e" },
        },
      },
    }),
    []
  );

  if (history.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-6 text-center">
        <p className="text-sm text-slate-400">
          Waiting for plant telemetry. Start the simulator with{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
            python scripts/data_publisher.py
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
