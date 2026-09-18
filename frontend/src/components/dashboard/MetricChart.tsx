import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { SensorReading } from "@/types";

type SeriesKey = "temperature" | "humidity";

interface Props {
  data: SensorReading[];
  type: SeriesKey;
  height?: number;
  showLegend?: boolean;
}

export function MetricChart({ data, type, height = 280, showLegend = true }: Props) {
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

  const showDots = chartData.length <= 48;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={44}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 12,
          }}
        />
        {showLegend && <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />}
        {type === "temperature" ? (
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#f97316"
            strokeWidth={2}
            dot={showDots ? { r: 3 } : false}
            name="Temperature (°C)"
            activeDot={{ r: 4 }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={showDots ? { r: 3 } : false}
            name="Humidity (%)"
            activeDot={{ r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}