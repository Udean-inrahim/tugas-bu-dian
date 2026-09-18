import { Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Settings } from "@/types";
import { classifyHumidity, formatTime } from "@/lib/threshold";
import { useCountUp } from "@/lib/useCountUp";
import { ConditionBadge, StatusDot } from "./ConditionBadge";
import { cn } from "@/lib/utils";

interface Props {
  humidity: number | null;
  sensorName?: string;
  lastUpdate?: string | null;
  settings: Settings | null;
}

export function HumidityCard({ humidity, sensorName, lastUpdate, settings }: Props) {
  const condition = classifyHumidity(humidity, settings);
  const animated = useCountUp(humidity);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="chip-icon bg-blue-50 text-blue-500">
          <Droplets className="h-6 w-6" />
        </span>
        <ConditionBadge condition={condition} />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-muted-foreground">Kelembapan</p>
      <p
        className={cn(
          "mt-1 whitespace-nowrap text-4xl font-extrabold tabular-nums tracking-tight",
          humidity === null && "text-muted-foreground"
        )}
      >
        {humidity !== null ? animated.toFixed(1) : "--"}
        <span className="ml-0.5 text-xl font-semibold text-muted-foreground">%</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <StatusDot color={condition.color} />
        <span className="truncate">{sensorName ?? "Semua sensor"}</span>
        {lastUpdate ? <span>• {formatTime(lastUpdate)}</span> : null}
      </p>
    </Card>
  );
}