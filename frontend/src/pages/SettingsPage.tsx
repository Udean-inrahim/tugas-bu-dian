import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Lock, KeyRound, UserCog, Thermometer, Droplets } from "lucide-react";
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
        <PageHeader title="Pengaturan" description="Pengaturan sistem dan ambang batas." />
        <Reveal>
          <AccountCard />
        </Reveal>
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
      <PageHeader title="Pengaturan" description="Atur ambang suhu, kelembapan, dan interval monitoring." />

      <Reveal>
        <AccountCard />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-[#c2761a]" /> Suhu
              </CardTitle>
              <CardDescription>Batas suhu (°C) untuk status normal</CardDescription>
            </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minTemp">Suhu minimum</Label>
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
              <Label htmlFor="maxTemp">Suhu maksimum</Label>
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
            <p className="text-[12.5px] leading-relaxed text-[#616879] sm:col-span-2">
              Di bawah {minTemp}°C disebut Dingin. {minTemp}°C sampai {maxTemp}°C disebut Normal. Di atas{" "}
              {maxTemp}°C disebut Panas.
            </p>
          </CardContent>
        </Card>
        </Reveal>

        <Reveal delay={80}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[#2563eb]" /> Kelembapan
              </CardTitle>
              <CardDescription>Batas kelembapan (%) untuk status normal</CardDescription>
            </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minHum">Kelembapan minimum</Label>
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
              <Label htmlFor="maxHum">Kelembapan maksimum</Label>
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
            <p className="text-[12.5px] leading-relaxed text-[#616879] sm:col-span-2">
              Di bawah {minHum}% disebut Kering. {minHum}% sampai {maxHum}% disebut Normal. Di atas{" "}
              {maxHum}% disebut Lembap.
            </p>
          </CardContent>
        </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle>Monitoring</CardTitle>
            <CardDescription>Interval pembaruan data pada dashboard</CardDescription>
          </CardHeader>
        <CardContent className="grid gap-4 sm:max-w-xs">
          <div className="space-y-2">
            <Label htmlFor="refresh">Interval pembaruan</Label>
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
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#3d41ad]" /> Reset Password Pengguna
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>Nilai ambang saat ini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.label} className="rounded-[12px] border border-[#eceef5] bg-[#f8f9fc] px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-[#616879]">{it.label}</p>
              <p className="mt-0.5 text-[18px] font-bold text-[#272a3b]">{it.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountCard() {
  const { user, updateMe } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [usernameState, setUsernameState] = useState<{
    checking?: boolean;
    taken?: boolean;
    invalid?: boolean;
  }>({});

  useEffect(() => {
    const val = username.trim();
    if (!val) {
      setUsernameState({});
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(val)) {
      setUsernameState({ invalid: true });
      return;
    }
    const current = user?.username;
    setUsernameState({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<{ available: boolean; valid: boolean }>(
          "/auth/check-username",
          { params: { username: val } }
        );
        if (current && current.toLowerCase() === val.toLowerCase()) {
          setUsernameState({});
          return;
        }
        setUsernameState(data.valid ? { taken: !data.available } : { invalid: true });
      } catch {
        setUsernameState({});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, user?.username]);

  const handleSave = async () => {
    const val = username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(val)) {
      toast.error("Username 3-20 karakter: huruf, angka, titik, garis bawah, atau strip");
      return;
    }
    if (usernameState.taken) {
      toast.error("Username telah digunakan");
      return;
    }
    setSaving(true);
    try {
      await updateMe({ username: val });
      toast.success("Username berhasil disimpan");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Gagal menyimpan username";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold text-ink">
          <UserCog className="h-4 w-4 text-primary" /> Akun
        </CardTitle>
        <CardDescription>
          Username dipakai untuk login bersama email. Harus unik — tidak boleh dipakai akun lain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input value={user?.name ?? ""} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} readOnly className="bg-muted/50" />
          </div>
        </div>
        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="accUsername">Username</Label>
          <Input
            id="accUsername"
            placeholder="misal: budi_99"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            spellCheck={false}
            className={
              usernameState.taken
                ? "border-destructive focus-visible:ring-destructive"
                : usernameState.invalid
                  ? "border-destructive/60 focus-visible:ring-destructive/60"
                  : ""
            }
          />
          {(usernameState.taken || usernameState.invalid) && !usernameState.checking && (
            <p className="text-xs font-medium text-destructive">
              {usernameState.taken
                ? "Username telah digunakan"
                : "3-20 karakter: huruf, angka, titik, garis bawah, atau strip"}
            </p>
          )}
          {usernameState.checking && (
            <p className="text-xs text-muted-foreground">Memeriksa ketersediaan...</p>
          )}
          {!usernameState.taken &&
            !usernameState.invalid &&
            !usernameState.checking &&
            username.trim().length >= 3 &&
            username.trim().toLowerCase() !== (user?.username ?? "").toLowerCase() && (
              <p className="text-xs font-medium text-emerald-600">Username tersedia</p>
            )}
        </div>
        <div>
          <Button onClick={handleSave} disabled={saving || usernameState.checking}>
            {saving ? "Menyimpan..." : "Simpan Username"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}