import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Power, Radio, KeyRound } from "lucide-react";
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
  const { sensors, create, regenerateKey, update, toggle, remove, loading } = useSensors();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sensor | null>(null);
  const [deleting, setDeleting] = useState<Sensor | null>(null);
  const [keyInfo, setKeyInfo] = useState<{ name: string; sensorCode: string; apiKey: string } | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: Sensor) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSave = async (values: { sensorCode: string; name: string; location: string }) => {
    if (editing) return update(editing.id, values);
    const created = await create(values);
    if (created.apiKey) {
      setKeyInfo({ name: created.name, sensorCode: created.sensorCode, apiKey: created.apiKey });
    }
    return created;
  };

  const handleRegenerateKey = async (s: Sensor) => {
    setKeyLoading(true);
    try {
      const res = await regenerateKey(s.id);
      setKeyInfo({ name: res.name, sensorCode: res.sensorCode, apiKey: res.apiKey });
      toast.success("API key baru dibuat. Key lama langsung tidak berlaku.");
    } catch {
      toast.error("Gagal membuat API key baru");
    } finally {
      setKeyLoading(false);
    }
  };

  const copyKey = () => {
    if (!keyInfo) return;
    navigator.clipboard?.writeText(keyInfo.apiKey).then(
      () => toast.success("API key disalin"),
      () => toast.error("Gagal menyalin")
    );
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
          <StatChip label="Total Sensor" value={sensors.length} dot="bg-[#4448b8]" />
          <StatChip label="Online" value={sensors.filter((s) => s.isActive && s.status === "ONLINE").length} dot="bg-[#37bc99]" />
          <StatChip label="Offline" value={sensors.filter((s) => s.isActive && s.status !== "ONLINE").length} dot="bg-[#ff6570]" />
          <StatChip label="Nonaktif" value={sensors.filter((s) => !s.isActive).length} dot="bg-[#b9bfcc]" />
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
            <Button type="button" onClick={openCreate} className="shrink-0">
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
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
                            <Badge
                              variant={s.hasApiKey ? "secondary" : "outline"}
                              className={cn(
                                s.hasApiKey
                                  ? "bg-[#e6f7f1] text-[#1e9e7e]"
                                  : "text-[#6b7280]"
                              )}
                              title="API key untuk mengirim data"
                            >
                              {s.hasApiKey ? "API Key" : "Tanpa Key"}
                            </Badge>
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
                            s.status === "ONLINE" ? "bg-[#37bc99]" : "bg-[#ff6570]"
                          )}
                        />
                        <Badge
                          variant="secondary"
                          className={cn(
                            s.status === "ONLINE"
                              ? "bg-[#e6f7f1] text-[#1e9e7e]"
                              : "bg-[#ffe9eb] text-[#d64550]"
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
                          title={s.hasApiKey ? "API key / buat key baru" : "Buat API key"}
                          disabled={keyLoading}
                          onClick={() => handleRegenerateKey(s)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="rounded-[20px] border-[#eceef5] bg-white shadow-[0_25px_70px_rgba(55,66,100,0.22)]">
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

      <Dialog open={Boolean(keyInfo)} onOpenChange={(o) => !o && setKeyInfo(null)}>
        <DialogContent className="rounded-[20px] border-[#eceef5] bg-white shadow-[0_25px_70px_rgba(55,66,100,0.22)]">
          <DialogHeader>
            <DialogTitle>API Key Sensor</DialogTitle>
            <DialogDescription>
              Kunci rahasia untuk <strong>{keyInfo?.name}</strong> ({keyInfo?.sensorCode}).
              Tempel kunci ini di firmware/skrip sensor saat mengirim data.
            </DialogDescription>
          </DialogHeader>
          {keyInfo && (
            <div className="space-y-4">
              <div className="rounded-[14px] border border-[#e2e5ee] bg-[#f8f9fc] p-4">
                <p className="break-all text-center font-mono text-[15px] font-bold tracking-wide text-[#272a3b]">
                  {keyInfo.apiKey}
                </p>
              </div>
              <div className="rounded-[12px] border border-dashed border-[#e4bd4e] bg-[#fdf9ee] p-3 text-[13px] leading-relaxed text-[#6b5a1f]">
                Salin dan simpan di tempat aman. Key hanya tampil{" "}
                <strong>sekali ini</strong>. Kalau lupa, buat key baru lewat tombol kunci di daftar
                sensor.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setKeyInfo(null)}>
                  Tutup
                </Button>
                <Button onClick={copyKey}>Salin API Key</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatChip({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="tech-frame flex items-center justify-between p-4">
      <div>
        <p className="text-[12px] font-semibold text-[#616879]">{label}</p>
        <p className="mt-1 text-[26px] font-bold leading-none text-[#272a3b]">{value}</p>
      </div>
      <i className={`h-2.5 w-2.5 rounded-full ${dot}`} />
    </div>
  );
}