import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDateTime, classifyTemperature, classifyHumidity, statusBg } from "@/lib/threshold";
import type { Paginated, SensorReading } from "@/types";

export function HistoryPage() {
  const { sensors } = useSensors();
  const { settings } = useSettings();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sensorId, setSensorId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [data, setData] = useState<SensorReading[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (sensorId !== "all") params.sensor_id = Number(sensorId);
      if (fromDate) params.from = new Date(fromDate).toISOString();
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.to = end.toISOString();
      }
      const { data } = await api.get<Paginated<SensorReading>>("/readings", { params });
      setData(data.data);
      setMeta(data.meta);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sensorId, fromDate, toDate]);

  useEffect(() => {
    const t = setTimeout(fetchHistory, 300);
    return () => clearTimeout(t);
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [sensorId, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const applySearch = () => setSearch((s) => s.trim());

  const filtered = search
    ? data.filter((r) => {
        const code = r.sensor?.sensorCode?.toLowerCase() ?? "";
        const name = r.sensor?.name?.toLowerCase() ?? "";
        const q = search.toLowerCase();
        return code.includes(q) || name.includes(q);
      })
    : data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Riwayat pengukuran suhu dan kelembapan."
      />

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter</CardTitle>
            <CardDescription>Filter riwayat berdasarkan tanggal dan sensor</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">Dari tanggal</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">Sampai tanggal</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sensor</Label>
              <Select value={sensorId} onValueChange={setSensorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua sensor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sensor</SelectItem>
                  {sensors.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.sensorCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Cari sensor</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Kode / nama sensor"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button type="button" variant="outline" onClick={applySearch}>
                  Cari
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pengukuran</CardTitle>
          <CardDescription>{meta.total} data ditemukan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Sensor</TableHead>
                    <TableHead className="text-right">Suhu</TableHead>
                    <TableHead className="text-right">Kelembapan</TableHead>
                    <TableHead className="hidden sm:table-cell">Status Suhu</TableHead>
                    <TableHead className="hidden sm:table-cell">Status Lembap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Tidak ada data yang cocok dengan filter
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((r) => {
                    const t = classifyTemperature(r.temperature, settings);
                    const h = classifyHumidity(r.humidity, settings);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="tabular-nums whitespace-nowrap">
                          {formatDateTime(r.recordedAt)}
                        </TableCell>
                        <TableCell>
                          {r.sensor?.name ?? `Sensor #${r.sensorId}`}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {r.sensor?.sensorCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-orange-600">
                          {r.temperature.toFixed(1)}°C
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-blue-600">
                          {r.humidity.toFixed(1)}%
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={statusBg[t.color]}>
                            {t.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={statusBg[h.color]}>
                            {h.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Halaman {meta.page} dari {meta.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </Reveal>
    </div>
  );
}