import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Sensor } from "@/types";

type SensorInput = {
  sensorCode: string;
  name: string;
  location: string;
};

export function useSensors() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ data: Sensor[] }>("/sensors");
      setSensors(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (body: SensorInput) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<Sensor>("/sensors", body);
      setSensors((prev) => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah sensor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { sensors, list, create, update, toggle, remove, loading, error };
}