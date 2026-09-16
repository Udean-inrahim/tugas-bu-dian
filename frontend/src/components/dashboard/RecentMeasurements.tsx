import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SensorReading, Settings } from "@/types";
import { classifyTemperature, classifyHumidity, formatTime, statusBg } from "@/lib/threshold";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  readings: SensorReading[];
  settings: Settings | null;
  loading?: boolean;
}

export function RecentMeasurements({ readings, settings, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Sensor</TableHead>
          <TableHead className="text-right">Suhu</TableHead>
          <TableHead className="text-right">Kelembapan</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {readings.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Belum ada data pengukuran
            </TableCell>
          </TableRow>
        )}
        {readings.map((r) => {
          const t = classifyTemperature(r.temperature, settings);
          const h = classifyHumidity(r.humidity, settings);
          return (
            <TableRow key={r.id}>
              <TableCell className="tabular-nums">{formatTime(r.recordedAt)}</TableCell>
              <TableCell className="max-w-[160px] truncate">
                {r.sensor?.name ?? `Sensor #${r.sensorId}`}
                <span className="text-muted-foreground ml-1 text-xs">
                  {r.sensor?.sensorCode}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {r.temperature.toFixed(1)}°C
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.humidity.toFixed(1)}%</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className={statusBg[t.color]}>
                    {t.label}
                  </Badge>
                  <Badge variant="secondary" className={statusBg[h.color]}>
                    {h.label}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}