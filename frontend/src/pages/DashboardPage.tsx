import { useCallback, useEffect, useMemo, useState } from "react";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import { useAlerts } from "@/hooks/useAlerts";
import { useReadings } from "@/hooks/useReadings";
import api from "@/lib/api";
import { classifyTemperature } from "@/lib/threshold";
import { TemperatureCard } from "@/components/dashboard/TemperatureCard";
import { HumidityCard } from "@/components/dashboard/HumidityCard";
import { SensorStatusCard } from "@/components/dashboard/SensorStatusCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { GradientRail } from "@/components/dashboard/GradientRail";
import { MoodBar } from "@/components/dashboard/FunMascot";
import { RecentMeasurements } from "@/components/dashboard/RecentMeasurements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/reveal";
import type { ChartRange, SensorReading } from "@/types";
import { CHART_RANGES } from "@/types";

const RANGE_SINCE: Record<ChartRange, number> = {
  "1h": 3_600_000,
  "6h": 6 * 3_600_000,
  "12h": 12 * 3_600_000,
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
};

export function DashboardPage() {
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

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <PageHeader
          title="Dashboard"
          description="Pantauan suhu dan kelembapan secara real-time."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Reveal delay={0}>
            <TemperatureCard
              temperature={latest?.temperature ?? null}
              sensorName={latest?.sensor?.name}
              lastUpdate={latest?.recordedAt}
              settings={settings}
            />
          </Reveal>
          <Reveal delay={80}>
            <HumidityCard
              humidity={latest?.humidity ?? null}
              sensorName={latest?.sensor?.name}
              lastUpdate={latest?.recordedAt}
              settings={settings}
            />
          </Reveal>
          <Reveal delay={160}>
            <SensorStatusCard sensors={sensors} />
          </Reveal>
          <Reveal delay={240}>
            <AlertsCard summary={summary} />
          </Reveal>
        </div>

        <Reveal>
          <MoodBar temperature={latest?.temperature ?? null} condition={classifyTemperature(latest?.temperature ?? null, settings)} />
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="heading-section">Suhu & Kelembapan</CardTitle>
                <CardDescription>Perubahan suhu dalam beberapa jam terakhir</CardDescription>
              </div>
              <RangeTabs value={range} onChange={setRange} />
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <MetricChart data={sortReadings(chartReadings)} type="temperature" height={280} />
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="heading-section">Pengukuran Terbaru</CardTitle>
              <CardDescription>Pengukuran suhu dan kelembapan terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentMeasurements readings={readings.slice(0, 10)} settings={settings} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <aside className="w-full shrink-0 xl:w-[320px]">
        <GradientRail sensors={sensors} reading={latest} settings={settings} />
      </aside>
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