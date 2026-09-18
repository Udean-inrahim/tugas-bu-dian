import { Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Sensor } from "@/types";

interface Props {
  sensors: Sensor[];
}

export function SensorStatusCard({ sensors }: Props) {
  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;
  const offline = activeSensors.filter((s) => s.status === "OFFLINE").length;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="chip-icon bg-green-50 text-green-500">
          <Radio className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
          {offline === 0 ? "Semua aktif" : `${offline} offline`}
        </span>
      </div>
      <p className="mt-4 text-[13px] font-semibold text-muted-foreground">Sensor Online</p>
      <p className="mt-1 whitespace-nowrap text-4xl font-extrabold tabular-nums tracking-tight">
        {online}
        <span className="ml-0.5 text-xl font-semibold text-muted-foreground">/ {activeSensors.length}</span>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {online} online · {offline} offline dari {activeSensors.length} sensor aktif
      </p>
    </Card>
  );
}