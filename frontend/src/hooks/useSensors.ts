import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Sensor, SensorCreateResult } from "@/types";

type SensorInput = {
  sensorCode: string;
  name: string;
  location: string;
};

export function useSensors() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ data: Sensor[] }>("/sensors");
      setSensors(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data sensor");
      throw err;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const create = useCallback(async (body: SensorInput) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<SensorCreateResult>("/sensors", body);
      const { apiKey, ...sensor } = data;
      setSensors((prev) => [...prev, sensor]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateKey = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ apiKey: string; sensorCode: string; name: string }>(
        `/sensors/${id}/regenerate-key`
      );
      await list(true);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat API key baru");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [list]);

  const update = useCallback(async (id: number, body: Partial<Sensor>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put<Sensor>(`/sensors/${id}`, body);
      setSensors((prev) => prev.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch<Sensor>(`/sensors/${id}/toggle`);
      setSensors((prev) => prev.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/sensors/${id}`);
      setSensors((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    list();
  }, [list]);

  return { sensors, list, create, regenerateKey, update, toggle, remove, loading, error };
}