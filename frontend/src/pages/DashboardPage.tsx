import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  History,
  Bell,
  Settings,
  LogOut,
  Thermometer,
  Radio,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import { useAlerts } from "@/hooks/useAlerts";
import { useReadings } from "@/hooks/useReadings";
import api from "@/lib/api";
import { classifyTemperature, formatTime } from "@/lib/threshold";
import type { SensorReading, Settings as StmSettings } from "@/types";
import "./dashboard.css";

const DAY_SHORT = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const NAV_ITEMS = [
  { to: "/", label: "Dasbor", icon: LayoutDashboard },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/sensors", label: "Sensor", icon: Cpu },
  { to: "/history", label: "Riwayat", icon: History },
  { to: "/alerts", label: "Alert", icon: Bell },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

const CHART_MAX = 150;
const REVIEW_MAX = 45;

const LINE_W = 1000;
const LINE_H = 220;
const LINE_PAD_X = 8;

type LineChart = {
  points: number;
  tLo: number;
  tHi: number;
  hLo: number;
  hHi: number;
  tempPath: string;
  tempArea: string;
  humPath: string;
  targetAt: number | null;
  xTicks: { label: string; at: number; align: "start" | "middle" | "end" }[];
  last: { at: number; tempAt: number; humAt: number; temperature: number; humidity: number; t: string };
};

function buildLine(rows: HourlyPoint[], hours: number, t: StmSettings | null): LineChart | null {
  const cutoff = Date.now() - hours * 3600_000;
  const pts = rows
    .filter((r) => new Date(r.t).getTime() >= cutoff)
    .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  if (pts.length === 0) return null;

  const temps = pts.map((p) => p.temperature);
  const hums = pts.map((p) => p.humidity);
  const tLo = Math.min(...temps, t?.minTemperature ?? Infinity) - 1.5;
  const tHi = Math.max(...temps, t?.maxTemperature ?? -Infinity) + 1.5;
  const hLo = Math.max(0, Math.min(...hums, t?.minHumidity ?? Infinity) - 4);
  const hHi = Math.min(100, Math.max(...hums, t?.maxHumidity ?? -Infinity) + 4);
  const spanT = Math.max(0.5, tHi - tLo);
  const spanH = Math.max(0.5, hHi - hLo);
  const innerW = LINE_W - LINE_PAD_X * 2;

  const x = (i: number) =>
    LINE_PAD_X + (pts.length === 1 ? innerW / 2 : (i * innerW) / (pts.length - 1));
  const yT = (v: number) => LINE_H - ((v - tLo) / spanT) * LINE_H;
  const yH = (v: number) => LINE_H - ((v - hLo) / spanH) * LINE_H;
  const path = (y: (v: number) => number, pick: (p: HourlyPoint) => number) =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(pick(p)).toFixed(1)}`)
      .join(" ");

  const tempPath = path(yT, (p) => p.temperature);
  const humPath = path(yH, (p) => p.humidity);
  const baseY = (LINE_H - 2).toFixed(1);
  const tempArea = `${tempPath} L${x(pts.length - 1).toFixed(1)} ${baseY} L${x(0).toFixed(1)} ${baseY} Z`;

  const xTicks: { label: string; at: number; align: "start" | "middle" | "end" }[] = [];
  const pushTick = (label: string, at: number) => {
    const last = xTicks[xTicks.length - 1];
    if (last && at - last.at < 0.055) return;
    const align = at < 0.02 ? "start" : at > 0.98 ? "end" : "middle";
    xTicks.push({ label, at, align });
  };
  if (hours <= 24) {
    pts.forEach((p, i) => {
      const d = new Date(p.t);
      if (d.getHours() % 4 === 0) {
        pushTick(`${String(d.getHours()).padStart(2, "0")}:00`, x(i) / LINE_W);
      }
    });
    if (xTicks.length < 2) {
      xTicks.length = 0;
      xTicks.push({ label: "24 jam", at: 0, align: "start" });
      xTicks.push({ label: "sekarang", at: 1, align: "end" });
    }
  } else {
    let lastDay = "";
    pts.forEach((p, i) => {
      const d = new Date(p.t);
      const key = d.toDateString();
      if (key !== lastDay) {
        lastDay = key;
        pushTick(DAY_SHORT[d.getDay()], x(i) / LINE_W);
      }
    });
  }

  const lastPoint = pts[pts.length - 1];
  return {
    points: pts.length,
    tLo,
    tHi,
    hLo,
    hHi,
    tempPath,
    tempArea,
    humPath,
    targetAt: t ? yT(t.maxTemperature) / LINE_H : null,
    xTicks,
    last: {
      at: x(pts.length - 1) / LINE_W,
      tempAt: yT(lastPoint.temperature) / LINE_H,
      humAt: yH(lastPoint.humidity) / LINE_H,
      temperature: lastPoint.temperature,
      humidity: lastPoint.humidity,
      t: lastPoint.t,
    },
  };
}

const COND_HEX: Record<string, string> = {
  green: "#1e9e7e",
  yellow: "#c99a1f",
  blue: "#2563eb",
  red: "#d64550",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function todayLabel() {
  const d = new Date();
  const camel = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

type DayBin = {
  label: string;
  temp: number | null;
  hum: number | null;
  isToday: boolean;
  tempPx: number;
  humPx: number;
};

type HourlyPoint = {
  t: string;
  temperature: number;
  humidity: number;
  count: number;
};

function buildWeek(rows: HourlyPoint[], settings: StmSettings | null) {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const groups = new Map<string, { tempSum: number; humSum: number; n: number }>();
  for (const r of rows) {
    const k = new Date(r.t).toDateString();
    const g = groups.get(k);
    if (g) {
      g.tempSum += r.temperature;
      g.humSum += r.humidity;
      g.n += 1;
    } else {
      groups.set(k, { tempSum: r.temperature, humSum: r.humidity, n: 1 });
    }
  }

  let max = 1;
  const bins: Omit<DayBin, "tempPx" | "humPx">[] = days.map((d, idx) => {
    const g = groups.get(d.toDateString());
    const temp = g ? g.tempSum / g.n : null;
    const hum = g ? g.humSum / g.n : null;
    if (temp != null) max = Math.max(max, temp);
    if (hum != null) max = Math.max(max, hum);
    return { label: DAY_SHORT[d.getDay()], temp, hum, isToday: idx === 6 };
  });

  if (settings) max = Math.max(max, settings.maxTemperature);

  const scale = (v: number | null) => (v == null ? 0 : Math.round((v / max) * CHART_MAX));
  const targetPx = settings
    ? Math.round((settings.maxTemperature / max) * CHART_MAX)
    : Math.round((30 / max) * CHART_MAX);

  const filled: DayBin[] = bins.map((b) => ({
    ...b,
    tempPx: scale(b.temp),
    humPx: scale(b.hum),
  }));

  const pointPx = filled[6].tempPx;
  return { bins: filled, targetPx, pointPx };
}

type Review = {
  min: number | null;
  max: number | null;
  avg: number | null;
  pctNormal: number;
  barsPx: number[];
};

function buildReview(rows: HourlyPoint[], t: StmSettings | null): Review {
  const since = Date.now() - 24 * 3600_000;
  const win = rows.filter((r) => new Date(r.t).getTime() >= since);

  const temps = win.map((r) => r.temperature);
  const min = temps.length ? Math.min(...temps) : null;
  const max = temps.length ? Math.max(...temps) : null;
  const avg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;

  const inRange = t
    ? win.filter((r) => r.temperature >= t.minTemperature && r.temperature <= t.maxTemperature).length
    : win.length;
  const pctNormal = win.length ? Math.round((inRange / win.length) * 100) : 0;

  const segmentMs = 24 * 3600_000 / 7;
  const segAvg: number[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = since + i * segmentMs;
    const end = start + segmentMs;
    const s = win.filter((r) => {
      const ts = new Date(r.t).getTime();
      return ts >= start && ts < end;
    });
    segAvg.push(s.length ? s.reduce((a, b) => a + b.temperature, 0) / s.length : 0);
  }

  const segMax = Math.max(1, ...segAvg);
  const barsPx = segAvg.map((v) => Math.max(8, Math.round((v / segMax) * REVIEW_MAX)));

  return { min, max, avg, pctNormal, barsPx };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sensors } = useSensors();
  const { settings } = useSettings();
  const { summary, list: reloadAlerts } = useAlerts({ status: "ACTIVE", limit: 5 });
  const { data: recent } = useReadings({ limit: 20 });

  const [series, setSeries] = useState<HourlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const loadSeries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get<{ data: HourlyPoint[] }>("/readings/hourly", {
        params: { hours: 24 * 7 },
      });
      setSeries(data.data);
    } catch {
      if (!silent) setSeries([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const refreshMs = Math.min(60_000, Math.max(1000, (settings?.refreshInterval ?? 5) * 1000));
  useEffect(() => {
    const id = setInterval(() => {
      loadSeries(true);
      reloadAlerts(undefined, true);
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, loadSeries, reloadAlerts]);

  const latest = useMemo(() => {
    const arr = [...recent].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    return arr[0] ?? null;
  }, [recent]);

  const week = useMemo(() => buildWeek(series, settings), [series, settings]);
  const review = useMemo(() => buildReview(series, settings), [series, settings]);

  const [range, setRange] = useState<"24h" | "7d">("7d");
  const line = useMemo(
    () => buildLine(series, range === "24h" ? 24 : 24 * 7, settings),
    [series, range, settings]
  );

  const recentRows = useMemo(
    () =>
      [...recent]
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
        .slice(0, 3),
    [recent]
  );

  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;

  const tempCond = classifyTemperature(latest?.temperature ?? null, settings);
  const condHex = COND_HEX[tempCond.color] ?? COND_HEX.green;

  const gz = useMemo(() => {
    const lo = settings?.minTemperature ?? 18;
    const hi = settings?.maxTemperature ?? 30;
    const pad = (hi - lo) * 0.6;
    const min = lo - pad;
    const max = hi + pad;
    const span = Math.max(1, max - min);
    const pos =
      latest?.temperature == null
        ? null
        : Math.min(100, Math.max(0, ((latest.temperature - min) / span) * 100));
    return {
      low: `${((lo - min) / span) * 100}%`,
      ok: `${((hi - lo) / span) * 100}%`,
      high: `${((max - hi) / span) * 100}%`,
      pos: pos ?? 50,
    };
  }, [settings, latest]);

  const alertPct =
    summary.active > 0 ? Math.min(100, Math.round((summary.critical / summary.active) * 100)) : 0;

  const hands = useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const hourDeg = ((hours % 12) + minutes / 60) * 30;
    const minuteDeg = minutes * 6;
    return { hourDeg, minuteDeg };
  }, [now]);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const hasData = series.length > 0;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dash">
      <div className="dash-shell">
        {/* ── Sidebar mini ── */}
        <aside className="dash-side">
          <div className="dash-logo" aria-hidden="true" />
          <nav className="dash-nav" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className={`dash-link${isActive ? " dash-active" : ""}`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </NavLink>
              );
            })}
          </nav>
          <button
            type="button"
            className="dash-link dash-logout"
            title="Keluar"
            aria-label="Keluar"
            onClick={handleLogout}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </aside>

        {/* ── Center ── */}
        <main className="dash-center">
          <header className="dash-header">
            <div className="dash-user">
              <div className="dash-avatar">{user?.name?.charAt(0).toUpperCase() ?? "U"}</div>
              <div>
                <div className="dash-greeting">{greeting()}</div>
                <div className="dash-username">{user?.name ?? "User"}</div>
              </div>
            </div>
            <div className="dash-header-right">
              <button
                type="button"
                className="dash-bell"
                title={`${summary.active} alert aktif`}
                aria-label={`${summary.active} alert aktif`}
                onClick={() => navigate("/alerts")}
              >
                <Bell className="h-[18px] w-[18px]" />
              </button>
              <div className="dash-date">{todayLabel()}</div>
            </div>
          </header>

          <div className="dash-top">
            {/* ── Aktivitas sensor (line chart) ── */}
            <section className="dash-activity">
              <div className="dash-activity-head">
                <h2>Aktivitas Sensor</h2>
                <div className="dash-range" role="group" aria-label="Rentang grafik">
                  <button
                    type="button"
                    className={range === "24h" ? "on" : ""}
                    onClick={() => setRange("24h")}
                  >
                    24 jam
                  </button>
                  <button
                    type="button"
                    className={range === "7d" ? "on" : ""}
                    onClick={() => setRange("7d")}
                  >
                    7 hari
                  </button>
                </div>
              </div>

              <div className="dash-activity-sub">
                <div className="dash-legend">
                  <span>
                    <i className="dash-dot-green" />
                    Suhu
                  </span>
                  <span>
                    <i className="dash-dot-pink" />
                    Lembap
                  </span>
                  <span>
                    <i className="dash-dot-yellow" />
                    Target
                  </span>
                </div>
                {line && (
                  <div className="dash-line-latest">
                    <span className="dash-line-value temp">
                      <i />
                      {line.last.temperature.toFixed(1)} °C
                    </span>
                    <span className="dash-line-value hum">
                      <i />
                      {line.last.humidity.toFixed(0)} %RH
                    </span>
                    <em>terakhir {formatTime(line.last.t)}</em>
                  </div>
                )}
              </div>

              <div className="dash-line">
                {!line && (
                  <div className="dash-chart-empty">
                    {loading ? "Memuat data…" : "Belum ada data pada rentang ini"}
                  </div>
                )}
                {line && (
                  <>
                    <div className="dash-line-plot">
                      <svg
                        viewBox={`0 0 ${LINE_W} ${LINE_H}`}
                        preserveAspectRatio="none"
                        className="dash-line-svg"
                        role="img"
                        aria-label={`Grafik suhu dan kelembapan per jam, ${line.points} titik`}
                      >
                        <defs>
                          <linearGradient id="dashTempFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#37bc99" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#37bc99" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {[0.25, 0.5, 0.75].map((g) => (
                          <line
                            key={g}
                            x1={0}
                            x2={LINE_W}
                            y1={LINE_H * g}
                            y2={LINE_H * g}
                            className="dash-line-grid"
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}
                        {line.targetAt !== null && (
                          <line
                            x1={0}
                            x2={LINE_W}
                            y1={line.targetAt * LINE_H}
                            y2={line.targetAt * LINE_H}
                            className="dash-line-target"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                        <path d={line.tempArea} fill="url(#dashTempFill)" />
                        <path
                          d={line.tempPath}
                          className="dash-line-temp"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={line.humPath}
                          className="dash-line-hum"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <span
                        className="dash-line-dot temp"
                        style={{ left: `${line.last.at * 100}%`, top: `${line.last.tempAt * 100}%` }}
                      />
                      <span
                        className="dash-line-dot hum"
                        style={{ left: `${line.last.at * 100}%`, top: `${line.last.humAt * 100}%` }}
                      />
                    </div>
                    <div className="dash-axis-y left">
                      <span>{line.tHi.toFixed(0)}°C</span>
                      <span>{((line.tHi + line.tLo) / 2).toFixed(0)}°C</span>
                      <span>{line.tLo.toFixed(0)}°C</span>
                    </div>
                    <div className="dash-axis-y right">
                      <span>{line.hHi.toFixed(0)}%</span>
                      <span>{((line.hHi + line.hLo) / 2).toFixed(0)}%</span>
                      <span>{line.hLo.toFixed(0)}%</span>
                    </div>
                  </>
                )}
              </div>
              <div className="dash-axis-x">
                {line?.xTicks.map((tick) => (
                  <span
                    key={`${tick.label}-${tick.at}`}
                    className={tick.align}
                    style={{ left: `${tick.at * 100}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </section>

            {/* ── Jam realtime ── */}
            <section className="dash-workout">
              <div className="dash-workout-top">
                <span>Pembacaan realtime</span>
                <span>Hari ini</span>
              </div>
              <div className="dash-clock" aria-hidden="true">
                <div className="dash-num dash-num-12">12</div>
                <div className="dash-num dash-num-3">3</div>
                <div className="dash-num dash-num-6">6</div>
                <div className="dash-num dash-num-9">9</div>
                <div className="dash-hand" style={{ transform: `rotate(${hands.hourDeg}deg)` }} />
                <div
                  className="dash-hand dash-minute"
                  style={{ transform: `rotate(${hands.minuteDeg}deg)` }}
                />
                <div className="dash-clock-center" />
              </div>
              <div className="dash-workout-bottom">
                <div className="dash-time">
                  {hh}:{mm}:{ss}
                </div>
                <span className={`dash-state ${online > 0 ? "dash-state-on" : "dash-state-off"}`}>
                  <i
                    className={`h-1.5 w-1.5 rounded-full ${online > 0 ? "bg-[#37bc99]" : "bg-[#ff5663]"}`}
                  />
                  {online > 0 ? "Sensor live" : "Offline"}
                </span>
              </div>
              <div className="dash-feed">
                <div className="dash-feed-head">
                  <span>3 pembacaan terakhir</span>
                  <em>tiap {settings?.refreshInterval ?? 5} dtk</em>
                </div>
                {recentRows.length === 0 && <div className="dash-feed-empty">Belum ada pembacaan</div>}
                {recentRows.map((r) => (
                  <div key={r.id} className="dash-feed-row">
                    <i
                      style={{
                        background: COND_HEX[classifyTemperature(r.temperature, settings).color],
                      }}
                    />
                    <span className="dash-feed-time">{formatTime(r.recordedAt)}</span>
                    <span className="dash-feed-temp">{r.temperature.toFixed(1)}°C</span>
                    <span className="dash-feed-hum">{Math.round(r.humidity)}%RH</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="dash-bottom">
{/* ── Status sensor ── */}
            <section className="dash-create">
              <div className="dash-card-title">Status Sensor</div>
              <div className="dash-gauge">
                <div className="dash-gauge-head">
                  <div>
                    <div className="dash-gauge-value">
                      <span
                        className="dash-gauge-icon"
                        style={{ color: condHex, background: `${condHex}18` }}
                      >
                        <Thermometer className="h-4 w-4" />
                      </span>
                      {latest?.temperature != null ? latest.temperature.toFixed(1) : "—"}
                      <span className="align-top text-[15px] font-bold text-[#8f95a6]">°C</span>
                    </div>
                    <div className="dash-gauge-cond" style={{ color: condHex }}>
                      <i className="h-2 w-2 rounded-full" style={{ background: condHex }} />
                      {latest ? tempCond.label : "Tidak ada data"}
                    </div>
                  </div>
                </div>
                <div className="dash-gauge-track" title="Posisi suhu saat ini terhadap ambang batas">
                  <div className="dash-gauge-zone dash-gauge-zone-low" style={{ width: gz.low }} />
                  <div className="dash-gauge-zone dash-gauge-zone-ok" style={{ width: gz.ok }} />
                  <div className="dash-gauge-zone dash-gauge-zone-high" style={{ width: gz.high }} />
                  {latest && (
                    <div className="dash-gauge-marker" style={{ left: `${gz.pos}%` }} />
                  )}
                </div>
<div className="dash-gauge-scale">
                    <span>
                      {settings?.minTemperature?.toFixed(1) ?? "—"}°C —{" "}
                      {settings?.maxTemperature?.toFixed(1) ?? "—"}°C
                    </span>
                    <em>rentang aman</em>
                  </div>
                  <div className="dash-gauge-foot">
                    <span className={`dash-live-row${online > 0 ? "" : " off"}`}>
                      <i className="dash-live-dot" />
                      {online}/{activeSensors.length} online
                    </span>
                    <small>{sensors.length} sensor terdaftar</small>
                  </div>
                </div>
            </section>

            {/* ── Ringkasan hari ini ── */}
            <section className="dash-today">
              <div className="dash-card-title">Ringkasan Hari Ini</div>
              <div className="dash-stats">
                <div className="dash-stat dash-active">
                  <div className="dash-stat-label">Suhu</div>
                  <div className="dash-stat-value">
                    {latest?.temperature != null ? latest.temperature.toFixed(1) : "—"}
                  </div>
                  <div className="dash-stat-unit">°C</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">Lembap</div>
                  <div className="dash-stat-value">
                    {latest?.humidity != null ? latest.humidity.toFixed(0) : "—"}
                  </div>
                  <div className="dash-stat-unit">%RH</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">Sensor online</div>
                  <div className="dash-stat-value">
                    {online}
                    <span className="text-[9px] font-semibold opacity-60">/{activeSensors.length}</span>
                  </div>
                  <div className="dash-stat-unit">aktif</div>
                </div>
              </div>

              <div className="dash-members-title">Sensor terdaftar</div>
              {sensors.length === 0 && (
                <p className="text-[10px] text-[#969caf]">Belum ada sensor terdaftar.</p>
              )}
              {sensors.slice(0, 2).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="dash-member"
                  title="Buka monitoring"
                  onClick={() => navigate("/monitoring")}
                >
                  <span className="dash-member-avatar">{s.name.charAt(0).toUpperCase()}</span>
                  <span>
                    <span className="dash-member-name">{s.name}</span>
                    <span className="dash-member-course">
                      {s.location} · {s.sensorCode}
                    </span>
                  </span>
                  <span
                    className={`dash-member-time ${
                      s.status === "ONLINE" ? "dash-online" : "dash-offline"
                    }`}
                  >
                    {s.status === "ONLINE" ? "Online" : "Offline"}
                  </span>
                </button>
              ))}
            </section>
          </div>
        </main>

        {/* ── Right panel ── */}
        <aside className="dash-right">
          <div className="dash-right-head">
            <div className="dash-right-title">Sensor</div>
            <button
              type="button"
              className="dash-right-more"
              onClick={() => navigate("/sensors")}
            >
              Kelola
            </button>
          </div>
          <div className="dash-tiles">
            {sensors.slice(0, 1).map((s) => (
              <button
                key={s.id}
                type="button"
                className="dash-tile dash-tile-one"
                onClick={() => navigate("/sensors")}
                title={s.name}
              >
                <Thermometer className="h-5 w-5" />
                <span className="dash-tile-label">{s.name}</span>
                <span className="dash-tile-sub">{s.location}</span>
                <span className="dash-tile-state">
                  <i />
                  {s.status === "ONLINE" ? "Online" : "Offline"}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="dash-tile dash-tile-two"
              onClick={() => navigate("/monitoring")}
              title="Monitoring sensor"
            >
              <Radio className="h-5 w-5" />
              <span className="dash-tile-label">Monitoring</span>
              <span className="dash-tile-sub">{online} dari {activeSensors.length} online</span>
              <span className="dash-tile-state dash-tile-state-on">
                <i />
                Live
              </span>
            </button>
            {sensors.length === 0 && (
              <button
                type="button"
                className="dash-tile dash-tile-add"
                onClick={() => navigate("/sensors")}
              >
                <span className="dash-tile-label">Belum ada sensor</span>
                <span className="dash-tile-sub">Tambahkan di halaman Sensor</span>
              </button>
            )}
          </div>

          <div className="dash-review">
            <div className="dash-review-title">Ringkasan 24 Jam</div>
            <div className="dash-review-values">
              <div>
                <small>Rata-rata</small>
                {review.avg != null ? `${review.avg.toFixed(1)}°` : "—"}
              </div>
              <div>
                <small>Tertinggi</small>
                {review.max != null ? `${review.max.toFixed(1)}°` : "—"}
              </div>
              <div>
                <small>Normal</small>
                {review.pctNormal}%
              </div>
            </div>
            <div className="dash-review-chart" aria-hidden="true">
              {review.barsPx.map((h, i) => (
                <div key={i} className="dash-review-bar" style={{ height: `${h}px` }} />
              ))}
            </div>
          </div>

          <div className="dash-points">
            <div className="dash-points-head">
              <div className="dash-points-title">Alert</div>
              {summary.critical > 0 && <div className="dash-loss">-{summary.critical} kritis</div>}
            </div>
            <div className="dash-point-stats">
              <div>
                <div className="dash-point-value">{summary.active}</div>
                <div className="dash-point-label">Aktif</div>
                <div className="dash-change">{summary.warning} peringatan</div>
              </div>
              <div>
                <div className="dash-point-value">{summary.critical}</div>
                <div className="dash-point-label">Kritis</div>
                <div className={`dash-change${summary.critical > 0 ? " red" : ""}`}>
                  {summary.active === 0 ? "Aman" : "Menunggu"}
                </div>
              </div>
            </div>
            <div className="dash-progress">
              <div
                className={
                  summary.active === 0
                    ? "dash-progress-ok"
                    : alertPct >= 60
                      ? "dash-progress-crit"
                      : "dash-progress-warn"
                }
                style={{ width: `${summary.active === 0 ? 100 : alertPct}%` }}
              />
            </div>
            <p className="dash-desc">
              {summary.active === 0
                ? "Tidak ada alert aktif. Semua sensor dalam batas aman."
                : `${summary.active} alert menunggu tindakan, ${summary.critical} di antaranya kritis. Periksa riwayat untuk detail.`}
            </p>
            <button type="button" className="dash-cta" onClick={() => navigate("/alerts")}>
              Lihat Alert
            </button>
          </div>

          <p className="dash-foot">
            Terakhir {latest ? formatTime(latest.recordedAt) : "—"} · {tempCond.label}
          </p>
        </aside>
      </div>
    </div>
  );
}
