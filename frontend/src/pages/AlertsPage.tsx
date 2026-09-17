import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, BellRing } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/stores/authStore";
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
  HIGH_TEMP: "bg-red-100 text-red-700",
  LOW_TEMP: "bg-blue-100 text-blue-700",
  HIGH_HUMIDITY: "bg-yellow-100 text-yellow-700",
  LOW_HUMIDITY: "bg-blue-100 text-blue-700",
  SENSOR_OFFLINE: "bg-gray-100 text-gray-700",
};

export function AlertsPage() {
  const [filter, setFilter] = useState<"ACTIVE" | "RESOLVED" | "ALL">("ACTIVE");
  const { alerts, summary, resolve, pending, list } = useAlerts({ status: filter, limit: 50 });
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const { registerHandler } = useSocket();

  useEffect(() => {
    const unsub1 = registerHandler("alert", () => list());
    const unsub2 = registerHandler("alert_resolved", () => list());
    return () => {
      unsub1();
      unsub2();
    };
  }, [registerHandler, list]);

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
                  <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4" />
              Daftar Alert
            </CardTitle>
          <CardDescription>
            {summary.critical} critical · {summary.warning} warning aktif
          </CardDescription>
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
                            a.severity === "CRITICAL" ? "bg-red-500" : "bg-yellow-500"
                          )}
                        />
                        <span className="truncate text-sm">{a.message}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === "ACTIVE" && isAdmin ? (
                        <Button variant="outline" size="sm" onClick={() => handleResolve(a.id)}>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Resolve
                        </Button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={a.status === "ACTIVE" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
                        >
                          {a.status === "ACTIVE" ? "ACTIVE" : "RESOLVED"}
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