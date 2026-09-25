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
        <span className="chip-icon bg-[#fdf6e3] text-[#c2761a]">
          <Thermometer className="h-6 w-6" />
        </span>
        <ConditionBadge condition={condition} />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-[#545b6c]">Suhu</p>
      <p
        className={cn(
          "mt-1 whitespace-nowrap text-[40px] font-extrabold leading-none tabular-nums tracking-tight text-[#272a3b]",
          temperature === null && "text-[#6b7280]"
        )}
      >
        {temperature !== null ? animated.toFixed(1) : "--"}
        <span className="ml-0.5 text-[19px] font-semibold text-[#6b7280]">°C</span>
      </p>
      <p className="mt-2.5 flex items-center gap-2 text-[12.5px] text-[#616879]">
        <StatusDot color={condition.color} />
        <span className="truncate">{sensorName ?? "Semua sensor"}</span>
        {lastUpdate ? <span>· {formatTime(lastUpdate)}</span> : null}
      </p>
    </Card>
  );
}