import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SensorReading } from "@/types";

type SeriesKey = "temperature" | "humidity";

interface Props {
  data: SensorReading[];
  type: SeriesKey;
  height?: number;
  showLegend?: boolean;
}

const THEME: Record<SeriesKey, { stroke: string; gradient: string; label: string }> = {
  temperature: {
    stroke: "#c2761a",
    gradient: "url(#stmGradTemp)",
    label: "Suhu (°C)",
  },
  humidity: {
    stroke: "#2563eb",
    gradient: "url(#stmGradHum)",
    label: "Kelembapan (%)",
  },
};

export function MetricChart({ data, type, height = 260 }: Props) {
  const chartData = data.map((r) => ({
    time: new Date(r.recordedAt).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature: r.temperature,
    humidity: r.humidity,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Belum ada data pada rentang ini.
      </div>
    );
  }

  const theme = THEME[type];
  const dataKey = type === "temperature" ? "temperature" : "humidity";
  const showDots = chartData.length <= 48;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="stmGradTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2761a" stopOpacity={0.24} />
            <stop offset="100%" stopColor="#c2761a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="stmGradHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={{ stroke: "#eef0f6" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={46}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #eceef5",
            fontSize: 13,
            color: "#272a3b",
            boxShadow: "0 12px 35px rgba(72,78,105,.12)",
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={theme.stroke}
          strokeWidth={2.5}
          fill={theme.gradient}
          dot={showDots ? { r: 3, fill: theme.stroke, strokeWidth: 0 } : false}
          activeDot={{ r: 4 }}
          name={theme.label}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}