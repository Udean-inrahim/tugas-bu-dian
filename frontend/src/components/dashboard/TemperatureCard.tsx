import { Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Settings } from "@/types";
import { classifyTemperature, formatTime } from "@/lib/threshold";
import { useCountUp } from "@/lib/useCountUp";
import { ConditionBadge, StatusDot } from "./ConditionBadge";
import { cn } from "@/lib/utils";

interface Props {
  temperature: number | null;
  sensorName?: string;
  lastUpdate?: string | null;
  settings: Settings | null;
}

export function TemperatureCard({ temperature, sensorName, lastUpdate, settings }: Props) {
  const condition = classifyTemperature(temperature, settings);
  const animated = useCountUp(temperature);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="chip-icon bg-orange-50 text-orange-500">
          <Thermometer className="h-6 w-6" />
        </span>
        <ConditionBadge condition={condition} />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-muted-foreground">Suhu</p>
      <p
        className={cn(
          "mt-1 whitespace-nowrap text-4xl font-extrabold tabular-nums tracking-tight",
          temperature === null && "text-muted-foreground"
        )}
      >
        {temperature !== null ? animated.toFixed(1) : "--"}
        <span className="ml-0.5 text-xl font-semibold text-muted-foreground">°C</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <StatusDot color={condition.color} />
        <span className="truncate">{sensorName ?? "Semua sensor"}</span>
        {lastUpdate ? <span>• {formatTime(lastUpdate)}</span> : null}
      </p>
    </Card>
  );
}