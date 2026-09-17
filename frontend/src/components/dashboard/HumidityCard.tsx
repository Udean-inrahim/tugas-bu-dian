import { Droplets } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Settings } from "@/types";
import { classifyHumidity, formatTime } from "@/lib/threshold";
import { useCountUp } from "@/lib/useCountUp";
import { ConditionBadge } from "./ConditionBadge";
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="micro-label flex min-w-0 items-center gap-2 text-black-light">
          <Droplets className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">Humidity</span>
        </CardTitle>
        <ConditionBadge condition={condition} className="shrink-0" />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "whitespace-nowrap text-4xl font-semibold tabular-nums lg:text-5xl",
            humidity === null && "text-black-light"
          )}
        >
          {humidity !== null ? animated.toFixed(1) : "--"}
          <span className="ml-1 text-lg font-normal text-black-light">%</span>
        </div>
        <CardDescription className="mt-2 line-clamp-1">
          {sensorName ?? "Semua sensor"} {lastUpdate ? `• ${formatTime(lastUpdate)}` : ""}
        </CardDescription>
      </CardContent>
    </Card>
  );
}