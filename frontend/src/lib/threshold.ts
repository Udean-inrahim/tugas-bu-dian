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
  green: "text-[#1e9e7e]",
  yellow: "text-[#8a6d12]",
  red: "text-[#d64550]",
  blue: "text-[#2563eb]",
};

export const dotBg: Record<string, string> = {
  green: "bg-[#37bc99]",
  yellow: "bg-[#e4bd4e]",
  red: "bg-[#ff6570]",
  blue: "bg-[#6fb6f5]",
};

export const statusBg: Record<string, string> = {
  green: "bg-[#e6f7f1] text-[#1e9e7e]",
  yellow: "bg-[#fdf6e3] text-[#8a6d12]",
  red: "bg-[#ffe9eb] text-[#d64550]",
  blue: "bg-[#e8f2fd] text-[#2563eb]",
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