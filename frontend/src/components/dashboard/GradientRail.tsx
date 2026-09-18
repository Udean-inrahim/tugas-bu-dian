import { Thermometer, Radio, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Sensor, SensorReading, Settings } from "@/types";
import { classifyTemperature, formatTime } from "@/lib/threshold";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  sensors: Sensor[];
  reading: SensorReading | null;
  settings: Settings | null;
}

function PulseDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function GradientRail({ sensors, reading, settings }: Props) {
  const navigate = useNavigate();
  const temperature = reading?.temperature ?? null;
  const humidity = reading?.humidity ?? null;
  const tempAnimated = useCountUp(temperature);

  const condition = classifyTemperature(temperature, settings);
  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;

  const R = 46;
  const C = 2 * Math.PI * R;
  const h = humidity !== null ? Math.min(100, Math.max(0, humidity)) : 0;
  const dash = (C * h) / 100;

  return (
    <div className="panel-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            {reading?.sensor?.name ?? "SEMUA SENSOR"}
          </p>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide">
            <PulseDot className="text-cyan-300" />
            LIVE
          </span>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <p className="font-clash whitespace-nowrap text-6xl font-extrabold leading-none tracking-tight">
            {temperature !== null ? tempAnimated.toFixed(1) : "--"}
          </p>
          <span className="pb-1 text-2xl font-semibold text-white/70">°C</span>
        </div>
        <p className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-white/80">
          <Thermometer className="h-4 w-4" />
          Suhu ruangan
          {reading?.recordedAt ? (
            <span className="ml-auto text-xs font-medium text-white/60">
              {formatTime(reading.recordedAt)}
            </span>
          ) : null}
        </p>

        <span
          className={cn(
            "mt-4 inline-flex rounded-full px-3 py-1 text-[11px] font-bold",
            condition.color === "green"
              ? "bg-emerald-400/20 text-emerald-100"
              : condition.color === "red"
                ? "bg-red-400/25 text-red-100"
                : "bg-amber-400/25 text-amber-100"
          )}
        >
          {condition.label}
        </span>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              Kelembapan
            </p>
            <svg width="64" height="64" viewBox="0 0 100 100" className="mx-auto mt-1">
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#6EE7B7"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
                transform="rotate(-90 50 50)"
              />
              <text
                x="50"
                y="54"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white"
                style={{ fontSize: 15, fontWeight: 800 }}
              >
                {humidity !== null ? humidity.toFixed(0) : "--"}
              </text>
              <text
                x="50"
                y="70"
                textAnchor="middle"
                className="fill-white/60"
                style={{ fontSize: 7 }}
              >
                %
              </text>
            </svg>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              Sensor Online
            </p>
            <p className="leading-none">
              <span className="text-4xl font-extrabold tabular-nums">{online}</span>
              <span className="ml-1 text-sm font-semibold text-white/60">/ {activeSensors.length}</span>
            </p>
            <svg viewBox="0 0 40 12" className="mt-auto w-full" aria-hidden>
              <polyline
                points="1,10 8,7 15,8 22,4 29,5 39,1"
                fill="none"
                stroke="rgba(255,255,255,.75)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {activeSensors.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <Radio className="h-4 w-4 text-white/60" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] font-medium text-white/60">{s.sensorCode}</p>
              </div>
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  s.status === "ONLINE"
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-white/10 text-white/50"
                )}
              >
                <PulseDot className={s.status === "ONLINE" ? "text-emerald-300" : "text-white/40"} />
                {s.status}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate("/monitoring")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
        >
          <Bell className="h-4 w-4" />
          Ke Halaman Monitoring
        </button>
      </div>
    </div>
  );
}