import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Alert, AlertSummary, Paginated } from "@/types";

type AlertQuery = {
  status?: "ACTIVE" | "RESOLVED" | "ALL";
  sensorId?: number;
  page?: number;
  limit?: number;
};

export function useAlerts(query: AlertQuery = {}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ active: 0, critical: 0, warning: 0 });
  const [pending, setPending] = useState(false);
  const [page, setPage] = useState(query.page ?? 1);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get<AlertSummary>("/alerts/summary");
      setSummary(data);
    } catch {
      /* ignore */
    }
  }, []);

  const list = useCallback(async (targetPage?: number) => {
    setPending(true);
    setError(null);
    const p = targetPage ?? page;
    try {
      const params: Record<string, string | number | undefined> = {
        page: p,
        limit: query.limit ?? 50,
      };
      if (query.status && query.status !== "ALL") params.status = query.status;
      if (query.sensorId) params.sensor_id = query.sensorId;
      const { data } = await api.get<Paginated<Alert>>("/alerts", { params });
      setAlerts(data.data);
      setMeta(data.meta);
      setPage(data.meta.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat alert");
    } finally {
      setPending(false);
    }
  }, [query.status, query.sensorId, query.limit, page]);

  const resolve = useCallback(async (id: number) => {
    const { data } = await api.put<Alert>(`/alerts/${id}/resolve`);
    setAlerts((prev) => prev.map((a) => (a.id === id ? data : a)));
    await fetchSummary();
    return data;
  }, [fetchSummary]);

  useEffect(() => {
    list();
    fetchSummary();
  }, [list, fetchSummary]);

  return { alerts, summary, list, resolve, pending, error, meta, page, setPage };
}