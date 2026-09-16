import type { Condition, Settings } from "@/types";

export function classifyTemperature(value: number | null, t: Settings | null): Condition {
  if (value === null) return { status: "CRITICAL", label: "Tidak Ada Data", color: "red" };
  if (!t) return { status: "NORMAL", label: "Normal", color: "green" };
  if (value < t.minTemperature) return { status: "WARNING", label: "Dingin", color: "blue" };
  if (value > t.maxTemperature) return { status: "CRITICAL", label: "Panas", color: "red" };
  return { status: "NORMAL", label: "Normal", color: "green" };
}

export function classifyHumidity(value: number | null, t: Settings | null): Condition {
  if (value === null) return { status: "CRITICAL", label: "Tidak Ada Data", color: "red" };
  if (!t) return { status: "NORMAL", label: "Normal", color: "green" };
  if (value < t.minHumidity) return { status: "WARNING", label: "Kering", color: "yellow" };
  if (value > t.maxHumidity) return { status: "CRITICAL", label: "Lembap", color: "red" };
  return { status: "NORMAL", label: "Normal", color: "green" };
}

export const statusColor: Record<string, string> = {
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  blue: "text-blue-600",
};

export const statusBg: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

export function formatTime(iso?: string | null) {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}