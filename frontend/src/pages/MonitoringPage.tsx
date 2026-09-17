import { useCallback, useEffect, useMemo, useState } from "react";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import { useSocket } from "@/hooks/useSocket";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { TemperatureCard } from "@/components/dashboard/TemperatureCard";
import { HumidityCard } from "@/components/dashboard/HumidityCard";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ChartRange, SensorReading } from "@/types";
import { CHART_RANGES } from "@/types";

const RANGE_SINCE: Record<ChartRange, number> = {
  "1h": 3_600_000,
  "6h": 6 * 3_600_000,
  "12h": 12 * 3_600_000,
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
};

export function MonitoringPage() {
  const { sensors } = useSensors();
  const { settings } = useSettings();
  const { registerHandler } = useSocket();

  const [selectedSensorId, setSelectedSensorId] = useState<string>("all");
  const [range, setRange] = useState<ChartRange>("6h");
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedSensor = useMemo(
    () => sensors.find((s) => String(s.id) === selectedSensorId) ?? null,
    [sensors, selectedSensorId]
  );

  const fetchLatest = useCallback(async () => {
    try {
      const params = selectedSensorId !== "all" ? { sensor_id: selectedSensorId } : {};
      const { data } = await api.get<SensorReading | null>("/readings/latest", { params });
      setLatest(data);
    } catch {
      setLatest(null);
    }
  }, [selectedSensorId]);

  const fetchHistory = useCallback(async (sensorFilter: string, rng: ChartRange) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        from: new Date(Date.now() - RANGE_SINCE[rng]).toISOString(),
        limit: 500,
      };
      if (sensorFilter !== "all") params.sensor_id = Number(sensorFilter);
      const { data } = await api.get<{ data: SensorReading[] }>("/readings", { params });
      setReadings(data.data);
    } catch {
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchLatest();
    fetchHistory(selectedSensorId, range);
  }, [fetchLatest, fetchHistory, selectedSensorId, range]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = registerHandler("reading", () => refresh());
    const unsubStatus = registerHandler("sensor_status", fetchLatest);
    return () => {
      unsub();
      unsubStatus();
    };
  }, [registerHandler, refresh, fetchLatest]);

  const sortedReadings = useMemo(
    () => [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [readings]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description="Pantauan suhu dan kelembapan secara detail."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Pilih sensor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sensor</SelectItem>
                {sensors.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.sensorCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={range} onValueChange={(v) => setRange(v as ChartRange)}>
              <TabsList className="flex-wrap">
                {CHART_RANGES.map((r) => (
                  <TabsTrigger key={r.value} value={r.value} className="px-2.5 text-xs">
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TemperatureCard
          temperature={latest?.temperature ?? null}
          sensorName={selectedSensor?.name ?? "Semua sensor"}
          lastUpdate={latest?.recordedAt}
          settings={settings}
        />
        <HumidityCard
          humidity={latest?.humidity ?? null}
          sensorName={selectedSensor?.name ?? "Semua sensor"}
          lastUpdate={latest?.recordedAt}
          settings={settings}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temperature — Suhu (°C)</CardTitle>
          <CardDescription>
            Grafik suhu {selectedSensor?.name ?? "semua sensor"} ({range})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <MetricChart data={sortedReadings} type="temperature" height={300} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Humidity — Kelembapan (%)</CardTitle>
          <CardDescription>
            Grafik kelembapan {selectedSensor?.name ?? "semua sensor"} ({range})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <MetricChart data={sortedReadings} type="humidity" height={300} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}