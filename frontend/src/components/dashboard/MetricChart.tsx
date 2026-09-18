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
    stroke: "hsl(238 70% 53%)",
    gradient: "url(#stmGradTemp)",
    label: "Suhu (°C)",
  },
  humidity: {
    stroke: "hsl(175 60% 42%)",
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
            <stop offset="0%" stopColor="hsl(238 80% 55%)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(238 80% 55%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="stmGradHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(175 60% 42%)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(175 60% 42%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 91%)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "hsl(220 10% 44%)" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(220 18% 91%)" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(220 10% 44%)" }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={46}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(220 18% 91%)",
            fontSize: 12,
            boxShadow: "0 8px 24px rgba(15,23,42,.08)",
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