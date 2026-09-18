import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Lock, KeyRound } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [minTemp, setMinTemp] = useState("18");
  const [maxTemp, setMaxTemp] = useState("30");
  const [minHum, setMinHum] = useState("40");
  const [maxHum, setMaxHum] = useState("70");
  const [refresh, setRefresh] = useState("5");
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{
    email: string;
    name: string;
    code: string;
    expiresAt: string;
  } | null>(null);

  const handleGenerateReset = async () => {
    if (!resetTarget.trim()) {
      toast.error("Masukkan email pengguna");
      return;
    }
    setResetLoading(true);
    try {
      const { data } = await api.post<{
        email: string;
        name: string;
        code: string;
        expiresAt: string;
      }>("/auth/reset-code", { email: resetTarget.trim() });
      setResetResult(data);
      toast.success("Kode reset dibuat");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Gagal membuat kode reset";
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setMinTemp(String(settings.minTemperature));
      setMaxTemp(String(settings.maxTemperature));
      setMinHum(String(settings.minHumidity));
      setMaxHum(String(settings.maxHumidity));
      setRefresh(String(settings.refreshInterval));
    }
  }, [settings]);

  const validate = (): string | null => {
    const mn = Number(minTemp);
    const mx = Number(maxTemp);
    if (Number.isNaN(mn) || Number.isNaN(mx)) return "Input temperature tidak valid";
    if (mn >= mx) return "Minimum temperature harus lebih kecil dari maksimum";
    const a = Number(minHum);
    const b = Number(maxHum);
    if (Number.isNaN(a) || Number.isNaN(b)) return "Input humidity tidak valid";
    if (a >= b) return "Minimum humidity harus lebih kecil dari maksimum";
    if (!Number.isInteger(Number(refresh)) || Number(refresh) < 1 || Number(refresh) > 300) {
      return "Refresh interval harus 1–300 detik";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        minTemperature: Number(minTemp),
        maxTemperature: Number(maxTemp),
        minHumidity: Number(minHum),
        maxHumidity: Number(maxHum),
        refreshInterval: Number(refresh),
      });
      toast.success("Pengaturan disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Pengaturan sistem dan threshold." />
        <Reveal>
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Hanya Admin yang dapat mengubah pengaturan sistem.
              </p>
            </CardContent>
          </Card>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal delay={0}>
            <ReadonlyCard title="Temperature Threshold" items={[
              { label: "Minimum Temperature", value: `${settings?.minTemperature} °C` },
              { label: "Maximum Temperature", value: `${settings?.maxTemperature} °C` },
            ]} />
          </Reveal>
          <Reveal delay={100}>
            <ReadonlyCard title="Humidity Threshold" items={[
              { label: "Minimum Humidity", value: `${settings?.minHumidity} %` },
              { label: "Maximum Humidity", value: `${settings?.maxHumidity} %` },
            ]} />
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Atur threshold suhu, kelembapan, dan interval monitoring." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-orange-500">🌡️</span> Temperature
              </CardTitle>
              <CardDescription>Batas suhu (°C) untuk status normal</CardDescription>
            </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minTemp">Minimum Temperature</Label>
              <div className="relative">
                <Input
                  id="minTemp"
                  type="number"
                  step="0.1"
                  value={minTemp}
                  onChange={(e) => setMinTemp(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  °C
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTemp">Maximum Temperature</Label>
              <div className="relative">
                <Input
                  id="maxTemp"
                  type="number"
                  step="0.1"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  °C
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Di bawah {minTemp}°C → Dingin · {minTemp}–{maxTemp}°C → Normal · di atas {maxTemp}°C → Panas
            </p>
          </CardContent>
        </Card>
        </Reveal>

        <Reveal delay={80}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-blue-500">💧</span> Humidity
              </CardTitle>
              <CardDescription>Batas kelembapan (%) untuk status normal</CardDescription>
            </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minHum">Minimum Humidity</Label>
              <div className="relative">
                <Input
                  id="minHum"
                  type="number"
                  step="0.1"
                  value={minHum}
                  onChange={(e) => setMinHum(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxHum">Maximum Humidity</Label>
              <div className="relative">
                <Input
                  id="maxHum"
                  type="number"
                  step="0.1"
                  value={maxHum}
                  onChange={(e) => setMaxHum(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Di bawah {minHum}% → Kering · {minHum}–{maxHum}% → Normal · di atas {maxHum}% → Lembap
            </p>
          </CardContent>
        </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitoring</CardTitle>
            <CardDescription>Interval pembaruan data pada dashboard</CardDescription>
          </CardHeader>
        <CardContent className="grid gap-4 sm:max-w-xs">
          <div className="space-y-2">
            <Label htmlFor="refresh">Refresh Interval</Label>
            <Select value={refresh} onValueChange={setRefresh}>
              <SelectTrigger id="refresh">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 detik</SelectItem>
                <SelectItem value="5">5 detik</SelectItem>
                <SelectItem value="10">10 detik</SelectItem>
                <SelectItem value="30">30 detik</SelectItem>
                <SelectItem value="60">60 detik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> Reset Password Pengguna
            </CardTitle>
            <CardDescription>
              Buat kode reset 6 digit untuk pengguna yang lupa password, lalu berikan kode tersebut
              kepadanya. Kode berlaku 15 menit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="resetTarget">Email Pengguna</Label>
                <Input
                  id="resetTarget"
                  type="email"
                  placeholder="user@example.com"
                  value={resetTarget}
                  onChange={(e) => setResetTarget(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerateReset} disabled={resetLoading}>
                {resetLoading ? "Membuat..." : "Buat Kode Reset"}
              </Button>
            </div>

            {resetResult && (
              <div className="rounded-md border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Kode reset untuk <span className="font-medium text-foreground">{resetResult.name}</span>{" "}
                  ({resetResult.email}):
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-bold tracking-[0.3em] tabular-nums text-primary">
                    {resetResult.code}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(resetResult.code);
                      toast.success("Kode disalin");
                    }}
                  >
                    Salin
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Berlaku sampai {new Date(resetResult.expiresAt).toLocaleTimeString("id-ID")}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className={cn(saving && "opacity-70")}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}

function ReadonlyCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm text-muted-foreground">{it.label}</span>
            <span className="text-sm font-semibold tabular-nums">{it.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}