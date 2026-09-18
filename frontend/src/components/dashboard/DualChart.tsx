import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SensorReading } from "@/types";

interface Props {
  data: SensorReading[];
  height?: number;
}

export function DualChart({ data, height = 240 }: Props) {
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 12, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="oroGradTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(233 76% 62%)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(233 76% 62%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="oroGradHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(183 57% 51%)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="hsl(183 57% 51%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eef0f4" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#a5a8b0" }}
          tickLine={false}
          axisLine={{ stroke: "#eef0f4" }}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#a5a8b0" }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={44}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #eef0f4",
            fontSize: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          }}
        />
        <Area
          type="monotone"
          dataKey="humidity"
          stroke="hsl(183 57% 51%)"
          strokeWidth={2.2}
          fill="url(#oroGradHum)"
          dot={false}
          name="Kelembapan (%)"
        />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="hsl(233 76% 62%)"
          strokeWidth={2.4}
          fill="url(#oroGradTemp)"
          dot={false}
          name="Suhu (°C)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}