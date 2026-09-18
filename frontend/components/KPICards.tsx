"use client";

interface KPICardsProps {
  health?: number;
  rul?: number;
  temperature?: number;
  gridStatus?: string;
  faultType?: string;
  mwLoss?: number;
}

function healthColor(h: number) {
  if (h > 70) return "text-green-400 border-green-500";
  if (h > 40) return "text-yellow-400 border-yellow-500";
  return "text-red-400 border-red-500";
}

function healthBg(h: number) {
  if (h > 70) return "bg-green-500/10";
  if (h > 40) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

function tempColor(t: number) {
  if (t < 60) return "text-green-400";
  if (t < 80) return "text-yellow-400";
  return "text-red-400";
}

export default function KPICards({
  health = 0,
  rul = 0,
  temperature = 0,
  gridStatus = "UNKNOWN",
  faultType = "NONE",
  mwLoss = 0,
}: KPICardsProps) {
  const hColor = healthColor(health);
  const hBg = healthBg(health);

  const gridColor =
    gridStatus === "STABLE"
      ? "text-green-400 border-green-500 bg-green-500/10"
      : gridStatus === "DEGRADED"
      ? "text-yellow-400 border-yellow-500 bg-yellow-500/10"
      : "text-red-400 border-red-500 bg-red-500/10";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Health Score */}
      <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${hColor} ${hBg}`}>
        <span className="text-xs uppercase tracking-widest text-gray-400">Health Score</span>
        <span className="text-4xl font-extrabold">{health.toFixed(1)}<span className="text-lg">%</span></span>
        <span className="text-xs text-gray-400 mt-1">
          {health > 70 ? "Normal" : health > 40 ? "Degraded" : "Critical"}
        </span>
        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${health > 70 ? "bg-green-500" : health > 40 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${Math.min(health, 100)}%` }}
          />
        </div>
      </div>

      {/* RUL Hours */}
      <div className="rounded-2xl border border-blue-500 bg-blue-500/10 p-4 flex flex-col gap-1 text-blue-400">
        <span className="text-xs uppercase tracking-widest text-gray-400">RUL Hours</span>
        <span className="text-4xl font-extrabold">{Math.round(rul)}<span className="text-lg">h</span></span>
        <span className="text-xs text-gray-400 mt-1">Remaining useful life</span>
        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.min((rul / 8760) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Temperature */}
      <div className={`rounded-2xl border border-gray-700 bg-gray-800/50 p-4 flex flex-col gap-1 ${tempColor(temperature)}`}>
        <span className="text-xs uppercase tracking-widest text-gray-400">Temperature</span>
        <span className="text-4xl font-extrabold">{temperature.toFixed(1)}<span className="text-lg">°C</span></span>
        <span className="text-xs text-gray-400 mt-1">Brush contact zone</span>
        <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${temperature < 60 ? "bg-green-500" : temperature < 80 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${Math.min((temperature / 120) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Grid Status */}
      <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${gridColor}`}>
        <span className="text-xs uppercase tracking-widest text-gray-400">Grid Status</span>
        <span className="text-2xl font-extrabold leading-tight">{gridStatus}</span>
        <span className="text-xs text-gray-400 mt-1">
          Fault: <span className="text-gray-200">{faultType}</span>
        </span>
        {mwLoss > 0 && (
          <span className="text-xs text-red-400 font-semibold mt-1">
            -{mwLoss.toFixed(1)} MW loss
          </span>
        )}
      </div>
    </div>
  );
}
