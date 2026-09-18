import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Power, Radio } from "lucide-react";
import { useSensors } from "@/hooks/useSensors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SensorForm } from "@/components/sensors/SensorForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/reveal";
import { formatTime } from "@/lib/threshold";
import { cn } from "@/lib/utils";
import type { Sensor } from "@/types";

export function SensorsPage() {
  const { sensors, create, update, toggle, remove, loading } = useSensors();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sensor | null>(null);
  const [deleting, setDeleting] = useState<Sensor | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: Sensor) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSave = (values: { sensorCode: string; name: string; location: string }) => {
    return editing ? update(editing.id, values) : create(values);
  };

  const handleToggle = async (s: Sensor) => {
    try {
      await toggle(s.id);
      toast.success(`${s.name} ${s.isActive ? "dinonaktifkan" : "diaktifkan"}`);
    } catch {
      toast.error("Gagal mengubah status sensor");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove(deleting.id);
      toast.success("Sensor dihapus");
    } catch {
      toast.error("Gagal menghapus sensor");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensor"
        description="Kelola sensor dan pantau status koneksi."
      />

      <Reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatChip label="Total Sensor" value={sensors.length} dot="bg-brand-blue" bg="bg-[#edf1ff] dark:bg-indigo-500/15" />
          <StatChip label="Online" value={sensors.filter((s) => s.isActive && s.status === "ONLINE").length} dot="bg-brand-green" bg="bg-[#e8f7f4] dark:bg-emerald-500/15" />
          <StatChip label="Offline" value={sensors.filter((s) => s.isActive && s.status !== "ONLINE").length} dot="bg-brand-danger" bg="bg-[#fde7ec] dark:bg-rose-500/15" />
          <StatChip label="Nonaktif" value={sensors.filter((s) => !s.isActive).length} dot="bg-[#8b8f9a]" bg="bg-[#eceef0] dark:bg-slate-500/20" />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-[15px] font-bold text-ink">Daftar Sensor</CardTitle>
              <CardDescription>
                {sensors.filter((s) => s.isActive).length} sensor aktif terdaftar
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="cursor-pointer rounded-full bg-brand-blue px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(83,110,232,0.3)] transition hover:bg-brand-blue/90"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Tambah
            </button>
          </CardHeader>
        <CardContent>
          {loading && sensors.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Lokasi</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Update</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Belum ada sensor. Klik tombol "Tambah" untuk menambahkan sensor pertamamu.
                    </TableCell>
                  </TableRow>
                )}
                {sensors.map((s) => (
                  <TableRow key={s.id} className={cn(!s.isActive && "opacity-50")}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 shrink-0 text-primary/70" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.sensorCode}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground md:hidden">
                            {s.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            s.status === "ONLINE" ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            s.status === "ONLINE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {s.status === "ONLINE" ? "Online" : "Offline"}
                        </Badge>
                        {!s.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{s.location}</TableCell>
                    <TableCell className="hidden lg:table-cell tabular-nums">
                      {formatTime(s.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => handleToggle(s)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleting(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </Reveal>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sensor" : "Tambah Sensor"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi sensor di bawah ini."
                : "Daftarkan sensor baru ke sistem monitoring."}
            </DialogDescription>
          </DialogHeader>
          <SensorForm
            initial={editing}
            onSubmit={handleSave}
            onDone={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sensor?</AlertDialogTitle>
            <AlertDialogDescription>
              Sensor <strong>{deleting?.name}</strong> ({deleting?.sensorCode}) beserta seluruh
              data pengukurannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatChip({ label, value, dot, bg }: { label: string; value: number; dot: string; bg: string }) {
  return (
    <div className={cn("flex items-center justify-between rounded-2xl p-4", bg)}>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-[20px] font-bold leading-none text-ink">{value}</p>
      </div>
      <i className={`h-2.5 w-2.5 rounded-full ${dot}`} />
    </div>
  );
}