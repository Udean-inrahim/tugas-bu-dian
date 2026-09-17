import { Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Sensor } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  sensors: Sensor[];
}

export function SensorStatusCard({ sensors }: Props) {
  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;
  const offline = activeSensors.filter((s) => s.status === "OFFLINE").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="micro-label flex items-center gap-2 text-black-light">
          <Radio className="h-4 w-4 text-primary" />
          Sensor Status
        </CardTitle>
        <Badge variant="secondary">
          {online} online · {offline} offline
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeSensors.length === 0 && (
          <p className="text-sm text-black-light">Belum ada sensor terdaftar.</p>
        )}
        {activeSensors.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {s.name} <span className="text-black-light">({s.sensorCode})</span>
              </p>
              <p className="truncate text-xs text-black-light">{s.location}</p>
            </div>
            <span
              className={cn(
                "ml-2 flex shrink-0 items-center gap-1.5 text-xs font-medium",
                s.status === "ONLINE" ? "text-green-600" : "text-red-600"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  s.status === "ONLINE" ? "bg-green-500" : "bg-red-500"
                )}
              />
              {s.status === "ONLINE" ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}