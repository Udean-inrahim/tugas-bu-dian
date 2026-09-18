import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Thermometer, Droplets, Radio, Bell, ShieldCheck } from "lucide-react";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import { useAlerts } from "@/hooks/useAlerts";
import { useReadings } from "@/hooks/useReadings";
import api from "@/lib/api";
import { DualChart } from "@/components/dashboard/DualChart";
import { RecentMeasurements } from "@/components/dashboard/RecentMeasurements";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/reveal";
import { classifyTemperature, classifyHumidity, dotBg, formatTime } from "@/lib/threshold";
import type { ChartRange, SensorReading } from "@/types";
import { CHART_RANGES } from "@/types";

const RANGE_SINCE: Record<ChartRange, number> = {
  "1h": 3_600_000,
  "6h": 6 * 3_600_000,
  "12h": 12 * 3_600_000,
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
};

const seeBtn =
  "cursor-pointer rounded-lg bg-[#e9edff] px-2.5 py-1.5 text-[10px] font-semibold text-brand-blue transition hover:bg-[#dfe5ff] dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/15";

export function DashboardPage() {
  const navigate = useNavigate();
  const { sensors, list: reloadSensors } = useSensors();
  const { settings } = useSettings();
  const { summary, list: reloadAlerts } = useAlerts({ status: "ACTIVE", limit: 5 });
  const { data: readings, refetch: reloadReadings } = useReadings({ limit: 20 });

  const [range, setRange] = useState<ChartRange>("24h");
  const [chartReadings, setChartReadings] = useState<SensorReading[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const loadChart = useCallback(
    async (silent = false) => {
      if (!silent) setChartLoading(true);
      try {
        const { data } = await api.get<{ data: SensorReading[] }>("/readings", {
          params: {
            from: new Date(Date.now() - RANGE_SINCE[range]).toISOString(),
            limit: 500,
          },
        });
        setChartReadings(data.data);
      } catch {
        if (!silent) setChartReadings([]);
      } finally {
        if (!silent) setChartLoading(false);
      }
    },
    [range]
  );

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  const latest = useMemo(() => {
    const arr = [...readings].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    return arr[0] ?? null;
  }, [readings]);

  const refreshAll = useCallback(() => {
    reloadReadings(true);
    reloadAlerts(undefined, true);
    reloadSensors(true);
    loadChart(true);
  }, [reloadReadings, reloadAlerts, reloadSensors, loadChart]);

  const refreshMs = Math.min(60_000, Math.max(1000, (settings?.refreshInterval ?? 5) * 1000));

  useEffect(() => {
    const id = setInterval(refreshAll, refreshMs);
    return () => clearInterval(id);
  }, [refreshAll, refreshMs]);

  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;

  const tempCond = classifyTemperature(latest?.temperature ?? null, settings);
  const humCond = classifyHumidity(latest?.humidity ?? null, settings);
  const alertPct = summary.active > 0 ? Math.min(100, Math.round((summary.critical / summary.active) * 100)) : 0;

  return (
    <div className="flex min-h-full flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description="Pantauan suhu dan kelembapan secara real-time."
      />

      <Reveal>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Pembacaan Terbaru (tinggi, 2 baris) */}
          <Card className="p-5 md:row-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Pembacaan Terbaru</h3>
              <button type="button" className={seeBtn} onClick={() => navigate("/history")}>
                Lihat semua
              </button>
            </div>
            <RecentMeasurements readings={readings.slice(0, 8)} settings={settings} />
          </Card>

          {/* Ringkasan */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Ringkasan</h3>
              <span className="rounded-[8px] bg-[#e8f7f4] px-2 py-1 text-[9px] font-bold text-[#278f7e] dark:bg-emerald-500/15 dark:text-emerald-300">
                REALTIME
              </span>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e9edff]">
                    <Thermometer className="h-3 w-3 text-brand-blue" />
                  </span>
                  Suhu saat ini
                </span>
                <strong className="text-[15px] font-bold text-ink">
                  {latest?.temperature != null ? `${latest.temperature.toFixed(1)}°` : "—"}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[#d2f6f4]">
                    <Droplets className="h-3 w-3 text-brand-cyan" />
                  </span>
                  Kelembapan
                </span>
                <strong className="text-[15px] font-bold text-ink">
                  {latest?.humidity != null ? `${latest.humidity.toFixed(0)}%` : "—"}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[#f0eff8]">
                    <ShieldCheck className="h-3 w-3 text-[#8b5cf6]" />
                  </span>
                  Kondisi
                </span>
                <span className="flex items-center gap-1.5">
                  <i className={`h-1.5 w-1.5 rounded-full ${dotBg[tempCond.color]}`} />
                  <span className="font-semibold text-ink">{tempCond.label}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[#f5d8e6]">
                    <Bell className="h-3 w-3 text-[#a0557a]" />
                  </span>
                  Alert aktif
                </span>
                <strong className={`text-[15px] ${summary.active > 0 ? "font-bold text-brand-danger" : "font-bold text-[#38c8a5]"}`}>
                  {summary.active}
                </strong>
              </div>
              <p className="border-t border-line pt-2 text-[9px] text-muted-foreground">
                Terakhir {latest ? formatTime(latest.recordedAt) : "—"}
              </p>
            </div>
          </Card>

          {/* Status sensor (gradien, gaya "Upcoming") */}
          <div className="relative overflow-hidden rounded-2xl p-5 [background:linear-gradient(135deg,#a7eeee,#c9f8f5)] dark:[background:linear-gradient(135deg,#134e4a,#115e59)]">
            <h3 className="text-[15px] font-bold text-[#17585e] dark:text-emerald-100">Sensor Status</h3>
            <p className="mt-1.5 text-[11px] font-semibold leading-snug text-[#17585e]/85 dark:text-emerald-200/90">
              {online} dari {activeSensors.length} sensor aktif
              <br />
              (total {sensors.length} terdaftar) dalam keadaan online.
            </p>
            <span className="pointer-events-none absolute right-3 bottom-[-6px] text-[44px] opacity-90 [transform:rotate(15deg)]">
              <Radio className="h-11 w-11 text-[#2f9b92] dark:text-emerald-300/80" />
            </span>
          </div>

          {/* Alert aktif (gaya pending) */}
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Alert Aktif</h3>
              <button type="button" className={seeBtn} onClick={() => navigate("/alerts")}>
                Lihat semua
              </button>
            </div>
            <p className="text-[12px] font-semibold text-ink">
              {summary.active === 0 ? "Semua aman" : `${summary.active} alert menunggu tindakan`}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e9edf3]">
              <i
                className="block h-full rounded-full bg-brand-blue transition-all"
                style={{ width: `${alertPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
              <span>{summary.critical} kritis</span>
              <span>{summary.warning} peringatan</span>
            </div>
          </Card>

          {/* Ambang batas (gaya regular) */}
          <Card className="border-0 p-5 [background:#bce9ff] dark:[background:#0e2a4d]">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#1f4b99] dark:text-sky-200">Ambang Batas</h3>
              <button type="button" className={seeBtn} onClick={() => navigate("/settings")}>
                Atur
              </button>
            </div>
            <p className="text-[11px] font-bold leading-snug text-[#1f4b99]/90 dark:text-sky-200/90">
              Suhu {settings?.minTemperature?.toFixed(1) ?? "—"}–{settings?.maxTemperature?.toFixed(1) ?? "—"}°C{" "}
              · Lembap {settings?.minHumidity?.toFixed(0) ?? "—"}–{settings?.maxHumidity?.toFixed(0) ?? "—"}%
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {sensors.slice(0, 6).map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[9px] font-semibold text-[#1f4b99] dark:border-white/10 dark:bg-white/10 dark:text-sky-100"
                >
                  <i
                    className={`h-1.5 w-1.5 rounded-full ${
                      !s.isActive ? "bg-[#8b8f9a]" : s.status === "ONLINE" ? "bg-[#38c8a5]" : "bg-brand-danger"
                    }`}
                  />
                  {s.name}
                </span>
              ))}
              {sensors.length > 6 && (
                <span className="rounded-full bg-white/70 px-2 py-1 text-[9px] font-semibold text-[#1f4b99] dark:bg-white/10 dark:text-sky-100">
                  +{sensors.length - 6}
                </span>
              )}
            </div>
          </Card>
        </div>
      </Reveal>

      {/* Grafik utama */}
      <Reveal>
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-ink">Overview</h3>
              <p className="text-[10px] text-muted-foreground">Suhu & kelembapan dalam rentang terpilih</p>
            </div>
            <RangeTabs value={range} onChange={setRange} />
          </div>
          {chartLoading ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <DualChart data={sortReadings(chartReadings)} height={240} />
          )}
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <i className="inline-block h-1.5 w-1.5 rounded-full bg-brand-cyan" /> Kelembapan
            </span>
            <span className="flex items-center gap-1">
              <i className="inline-block h-1.5 w-1.5 rounded-full bg-brand-blue" /> Suhu
            </span>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

function sortReadings(data: SensorReading[]) {
  return [...data].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
}

function RangeTabs({ value, onChange }: { value: ChartRange; onChange: (v: ChartRange) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ChartRange)}>
      <TabsList className="flex-wrap">
        {CHART_RANGES.map((r) => (
          <TabsTrigger key={r.value} value={r.value} className="px-3 text-xs">
            {r.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}