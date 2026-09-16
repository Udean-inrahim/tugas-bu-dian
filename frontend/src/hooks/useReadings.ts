import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Paginated, SensorReading, ChartRange } from "@/types";

const RANGE_MS: Record<ChartRange, number> = {
  "1h": 3600_000,
  "6h": 6 * 3600_000,
  "12h": 12 * 3600_000,
  "24h": 24 * 3600_000,
  "7d": 7 * 24 * 3600_000,
};

export type ReadingQuery = {
  sensorId?: number;
  range?: ChartRange;
  page?: number;
  limit?: number;
};

export function useReadings(query: ReadingQuery = {}) {
  const [data, setData] = useState<SensorReading[]>([]);
  const [meta, setMeta] = useState<{ page: number; total: number; totalPages: number }>({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = {
        page: query.page ?? 1,
        limit: query.limit ?? 200,
      };
      if (query.sensorId) params.sensor_id = query.sensorId;
      if (query.range) {
        params.from = new Date(Date.now() - RANGE_MS[query.range]).toISOString();
      }
      const { data } = await api.get<Paginated<SensorReading>>("/readings", { params });
      setData(data.data);
      setMeta({
        page: data.meta.page,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data riwayat");
    } finally {
      setLoading(false);
    }
  }, [query.sensorId, query.range, query.page, query.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, meta, loading, error, refetch };
}

export function useLatestReading(sensorId?: number) {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!sensorId) {
      setReading(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<SensorReading | null>("/readings/latest", {
        params: { sensor_id: sensorId },
      });
      setReading(data);
    } catch {
      setReading(null);
    } finally {
      setLoading(false);
    }
  }, [sensorId]);

  useEffect(() => {
    refetch();
  }, [refetch, sensorId]);

  return { reading, loading, refetch };
}