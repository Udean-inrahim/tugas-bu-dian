import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Step = "form" | "verify";

function errorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

function PulseDot({ className }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const presetEmail = (location.state as { email?: string } | null)?.email ?? "";
  const swapDir = (location.state as { dir?: string } | null)?.dir;
  const swapClass =
    swapDir === "to-login" ? "auth-swap-left" : swapDir === "to-register" ? "auth-swap-right" : "auth-swap-fade";
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const register = useAuthStore((s) => s.register);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const loading = useAuthStore((s) => s.loading);

  const [step, setStep] = useState<Step>(presetEmail ? "verify" : "form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) navigate("/", { replace: true });
  }, [hydrated, token, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }
    try {
      const res = await register(name, email, password);
      setDemoCode(res.code ?? null);
      setEmail(res.email);
      setStep("verify");
      toast.success(
        res.emailSent
          ? "Kode verifikasi dikirim ke email kamu"
          : "Akun dibuat. Masukkan kode verifikasi di bawah"
      );
    } catch (err) {
      toast.error(errorMessage(err, "Gagal mendaftar"));
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmail(email, code);
      toast.success("Email terverifikasi. Selamat datang!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Kode verifikasi salah"));
    }
  };

  const handleResend = async () => {
    try {
      const { data } = await api.post<{ emailSent?: boolean; code?: string }>(
        "/auth/resend-verification",
        { email }
      );
      setDemoCode(data.code ?? null);
      toast.success(data.emailSent ? "Kode baru dikirim ke email" : "Kode baru dibuat");
    } catch (err) {
      toast.error(errorMessage(err, "Gagal mengirim ulang kode"));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      {/* Latar gradien indigo + grid hero */}
      <div className="pointer-events-none absolute inset-0 panel-gradient" />
      <div className="hero-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,rgba(0,0,0,1),rgba(0,0,0,0.55))]" />
      <div className="pointer-events-none absolute -left-24 bottom-8 h-80 w-80 rounded-full bg-[#AEB2E6]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

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
              Buat akun baru
            </p>
            <h1 className="heading-page max-w-lg text-white">
              Mulai Memantau dalam{" "}
              <span className="text-[#A7F3D0]">Hitungan Menit.</span>
            </h1>
            <p className="max-w-md text-[15px] leading-relaxed text-white/70">
              Daftar dengan email aktif, verifikasi lewat kode 6 digit, lalu langsung masuk ke
              dashboard monitoring Anda.
            </p>
          </div>

          {/* Kartu mini "gauge" dekoratif */}
          <div className="mt-12 hidden max-w-sm lg:block">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Sensor Zona
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                  <PulseDot className="text-emerald-300" />
                  2 ONLINE
                </span>
              </div>
              <div className="flex items-center gap-5">
                <svg width="72" height="72" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#6EE7B7"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="198 264"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-white" style={{ fontSize: 22, fontWeight: 800 }}>
                    58
                  </text>
                  <text x="50" y="66" textAnchor="middle" className="fill-white/60" style={{ fontSize: 8 }}>
                    % RH
                  </text>
                </svg>
                <p className="text-sm leading-relaxed text-white/70">
                  Kelembapan stabil di zona aman. Notifikasi hanya saat melewati ambang batas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanan — form kartu */}
        <div className="mx-auto w-full max-w-md">
          <div className={`auth-swap ${swapClass}`}>
            <div className="rounded-3xl border border-white/40 bg-white p-8 shadow-2xl shadow-indigo-950/40 backdrop-blur">
              {step === "form" ? (
                <>
                  <div className="mb-8">
                    <p className="micro-label mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-primary">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      Pendaftaran
                    </p>
                    <h2 className="heading-page text-ink">Daftar</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Email asli atau email apa pun yang aktif
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama</Label>
                      <Input
                        id="name"
                        placeholder="Nama lengkap"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regEmail">Email</Label>
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="nama@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regConfirm">Konfirmasi Password</Label>
                      <Input
                        id="regConfirm"
                        type="password"
                        placeholder="••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" variant="default" className="w-full" disabled={loading}>
                      {loading ? "Mengirim..." : "Kirim Kode"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Kode verifikasi akan dikirim ke emailmu setelah menekan tombol di atas.
                    </p>
                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <Link
                      to="/login"
                      state={{ dir: "to-login" }}
                      className="font-medium text-primary hover:underline"
                    >
                      Login
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <p className="micro-label mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-primary">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      Verifikasi
                    </p>
                    <h2 className="heading-page text-ink">Cek Email</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Masukkan kode 6 digit yang dikirim ke <strong>{email}</strong>
                    </p>
                  </div>

                  {demoCode && (
                    <div className="mb-5 border border-primary/40 bg-primary/5 p-3 text-sm">
                      <p className="font-medium text-primary">Mode demo (email belum dikonfigurasi)</p>
                      <p className="mt-1 text-black-light">
                        Kode verifikasi kamu:{" "}
                        <span className="font-mono text-base font-bold">{demoCode}</span>
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleVerify} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="verifyCode">Kode Verifikasi</Label>
                      <Input
                        id="verifyCode"
                        inputMode="numeric"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={6}
                        className="text-center text-lg tracking-[0.4em]"
                      />
                    </div>
                    <Button type="submit" variant="default" className="w-full" disabled={loading}>
                      {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
                    </Button>
                  </form>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-medium text-primary hover:underline"
                    >
                      Kirim ulang kode
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="text-muted-foreground hover:underline"
                    >
                      Ganti email
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}