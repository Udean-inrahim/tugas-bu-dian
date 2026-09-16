import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Settings } from "@/types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Settings>("/settings");
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (body: Partial<Settings>) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put<Settings>("/settings", body);
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, updateSettings, loading, error, refetch: fetchSettings };
}