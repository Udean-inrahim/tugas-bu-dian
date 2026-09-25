import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, BellRing } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/reveal";
import { formatDateTime } from "@/lib/threshold";
import { cn } from "@/lib/utils";
import type { AlertType } from "@/types";

const typeLabel: Record<AlertType, string> = {
  HIGH_TEMP: "Temperature Tinggi",
  LOW_TEMP: "Temperature Rendah",
  HIGH_HUMIDITY: "Kelembapan Tinggi",
  LOW_HUMIDITY: "Kelembapan Rendah",
  SENSOR_OFFLINE: "Sensor Offline",
};

const typeBadgeClass: Record<AlertType, string> = {
  HIGH_TEMP: "bg-[#ffe9eb] text-[#d64550]",
  LOW_TEMP: "bg-[#e8f2fd] text-[#2563eb]",
  HIGH_HUMIDITY: "bg-[#fdf6e3] text-[#8a6d12]",
  LOW_HUMIDITY: "bg-[#e8f2fd] text-[#2563eb]",
  SENSOR_OFFLINE: "bg-[#f1f3f9] text-[#545b6c]",
};

export function AlertsPage() {
  const [filter, setFilter] = useState<"ACTIVE" | "RESOLVED" | "ALL">("ACTIVE");
  const { alerts, summary, refresh, resolve, pending, list } = useAlerts({ status: filter, limit: 50 });
  const { settings } = useSettings();

  const refreshMs = Math.min(
    60_000,
    Math.max(1000, (settings?.refreshInterval ?? 5) * 1000)
  );

  useEffect(() => {
    const id = setInterval(() => refresh(), refreshMs);
    return () => clearInterval(id);
  }, [refresh, refreshMs]);

  const handleResolve = async (id: number) => {
    try {
      await resolve(id);
      toast.success("Alert ditandai selesai");
    } catch {
      toast.error("Gagal menyelesaikan alert");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Notifikasi kondisi abnormal dan sensor offline."
        action={
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="ACTIVE">
                Aktif
                {summary.active > 0 && (
                  <span className="ml-1.5 rounded-[6px] bg-[#ff6570] px-1.5 py-0.5 text-[11px] font-bold leading-4 text-white">
                    {summary.active}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="RESOLVED">Selesai</TabsTrigger>
              <TabsTrigger value="ALL">Semua</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <Reveal>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#3d41ad]" />
                Daftar Alert
              </CardTitle>
              <CardDescription>
                {summary.critical} critical, {summary.warning} warning aktif
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-[8px] bg-[#ffe9eb] px-2.5 py-1 text-[12px] font-bold text-[#d64550]">
                {summary.critical} Critical
              </span>
              <span className="rounded-[8px] bg-[#fdf6e3] px-2.5 py-1 text-[12px] font-bold text-[#8a6d12]">
                {summary.warning} Warning
              </span>
            </div>
          </CardHeader>
        <CardContent>
          {pending ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead className="hidden md:table-cell">Sensor</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="hidden sm:table-cell">Nilai / Batas</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada alert {filter === "ACTIVE" ? "aktif" : ""}
                    </TableCell>
                  </TableRow>
                )}
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {formatDateTime(a.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {a.sensor?.name ?? `Sensor #${a.sensorId}`}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {a.sensor?.sensorCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeBadgeClass[a.type]}>
                        {typeLabel[a.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums text-xs text-muted-foreground">
                      {a.type.includes("TEMP") ? `${a.value.toFixed(1)} / ${a.threshold.toFixed(1)}°C` : `${a.value.toFixed(1)} / ${a.threshold.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            a.severity === "CRITICAL" ? "bg-[#ff6570]" : "bg-[#e4bd4e]"
                          )}
                        />
                        <span className="truncate text-[13.5px]">{a.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === "ACTIVE" ? (
                        <Button variant="outline" size="sm" onClick={() => handleResolve(a.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Tandai selesai
                        </Button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-[#e6f7f1] text-[#1e9e7e]"
                        >
                          Selesai
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </Reveal>
    </div>
  );
}