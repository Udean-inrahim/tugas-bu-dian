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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Droplets className="h-4 w-4 text-blue-500" />
          Humidity
        </CardTitle>
        <ConditionBadge condition={condition} />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-3xl font-bold tabular-nums lg:text-4xl",
            humidity === null && "text-muted-foreground"
          )}
        >
          {humidity !== null ? humidity.toFixed(1) : "--"}
          <span className="ml-1 text-lg font-normal text-muted-foreground">%</span>
        </div>
        <CardDescription className="mt-2 line-clamp-1">
          {sensorName ?? "Semua sensor"} {lastUpdate ? `• ${formatTime(lastUpdate)}` : ""}
        </CardDescription>
      </CardContent>
    </Card>
  );
}