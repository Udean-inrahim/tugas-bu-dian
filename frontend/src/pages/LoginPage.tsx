import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function PulseDot({ className }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const swapDir = (location.state as { dir?: string } | null)?.dir;
  const swapClass =
    swapDir === "to-login" ? "auth-swap-left" : swapDir === "to-register" ? "auth-swap-right" : "auth-swap-fade";
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSendLoading, setResetSendLoading] = useState(false);
  const [resetDemoCode, setResetDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) {
      navigate("/", { replace: true });
    }
  }, [hydrated, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/", { replace: true });
      toast.success("Login berhasil");
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      if (data?.error === "EMAIL_NOT_VERIFIED") {
        toast.error(data.message ?? "Email belum diverifikasi");
        navigate("/register", { state: { email, dir: "to-register" } });
      } else {
        toast.error("Email atau password salah");
      }
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        code: resetCode,
        newPassword: resetPassword,
      });
      toast.success("Password berhasil diubah. Silakan login.");
      setEmail(resetEmail);
      setResetOpen(false);
      setResetCode("");
      setResetPassword("");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Gagal mereset password";
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    if (!resetEmail) {
      toast.error("Masukkan email dulu");
      return;
    }
    setResetSendLoading(true);
    try {
      const { data } = await api.post<{ emailSent?: boolean; code?: string }>(
        "/auth/request-reset",
        { email: resetEmail }
      );
      setResetDemoCode(data.code ?? null);
      toast.success(
        data.emailSent ? "Kode reset dikirim ke email" : "Kode reset dibuat (mode demo)"
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Gagal mengirim kode";
      toast.error(msg);
    } finally {
      setResetSendLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      {/* Latar gradien indigo + grid hero */}
      <div className="pointer-events-none absolute inset-0 panel-gradient" />
      <div className="hero-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,rgba(0,0,0,1),rgba(0,0,0,0.55))]" />
      <div className="pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full bg-[#AEB2E6]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-400/30 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-2 lg:px-10">
        {/* Kiri — pesan hero */}
        <div className="text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-sm font-extrabold ring-1 ring-white/30 backdrop-blur">
              ST
            </span>
            <span className="micro-label text-white/80">Smart Temp Monitor</span>
          </div>

          <div className="mt-14 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/85 ring-1 ring-white/15 backdrop-blur">
              <PulseDot className="text-emerald-300" />
              Pantauan real-time
            </p>
            <h1 className="heading-page max-w-lg text-white">
              Pantau Suhu &amp; Kelembapan{" "}
              <span className="text-[#A7F3D0]">Real-Time.</span>
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-white/70">
              Dasbor monitoring berbasis web untuk sensor suhu dan kelembapan. Data terbaru setiap
              beberapa menit, peringatan otomatis dikirim ke email Anda.
            </p>
          </div>

          {/* Kartu mini "live" dekoratif */}
          <div className="mt-12 hidden max-w-sm lg:block">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Suhu Ruangan
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                  <PulseDot className="text-emerald-300" />
                  LIVE
                </span>
              </div>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                26.4<span className="ml-1 text-lg font-semibold text-white/60">°C</span>
              </p>
              <svg viewBox="0 0 240 48" className="mt-3 w-full" aria-hidden>
                <defs>
                  <linearGradient id="stmHeroLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,40 C24,36 36,30 60,31 C84,32 96,24 120,22 C144,20 156,14 180,10 C204,6 222,6 240,2 L240,48 L0,48 Z"
                  fill="url(#stmHeroLine)"
                />
                <polyline
                  points="0,40 36,30 60,31 96,24 120,22 156,14 180,10 222,6 240,2"
                  fill="none"
                  stroke="#6EE7B7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Kanan — form kartu */}
        <div className="mx-auto w-full max-w-md">
          <div className={`auth-swap ${swapClass}`}>
            <div className="rounded-3xl border border-white/40 bg-white p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur">
              <div className="mb-8">
                <p className="micro-label mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-primary">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Akses masuk
                </p>
                <h2 className="heading-page text-ink">Login</h2>
                <p className="mt-2 text-sm text-muted-foreground">Masuk ke dashboard monitoring</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-black-light hover:text-foreground"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetOpen(true);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                <Button type="submit" variant="default" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Login"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link
                    to="/register"
                    state={{ dir: "to-register" }}
                    className="font-medium text-primary hover:underline"
                  >
                    Daftar
                  </Link>
                </p>
                <p className="text-center text-xs uppercase tracking-wide text-black-light">
                  mbg bracun
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase">Reset Password</DialogTitle>
            <DialogDescription>
              Masukkan email, klik <strong>Kirim Kode</strong>, lalu masukkan kode 6 digit dari
              email dan password baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="nama@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendResetCode}
                  disabled={resetSendLoading}
                  className="shrink-0"
                >
                  {resetSendLoading ? "Mengirim..." : "Kirim Kode"}
                </Button>
              </div>
            </div>
            {resetDemoCode && (
              <div className="border border-primary/40 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">Mode demo (email belum dikonfigurasi)</p>
                <p className="mt-1 text-black-light">
                  Kode reset:{" "}
                  <span className="font-mono text-base font-bold">{resetDemoCode}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resetCode">Kode Reset</Label>
              <Input
                id="resetCode"
                inputMode="numeric"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resetPassword">Password Baru</Label>
              <Input
                id="resetPassword"
                type="password"
                placeholder="••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}