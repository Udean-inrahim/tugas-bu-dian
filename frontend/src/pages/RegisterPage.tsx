import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";
import { toast } from "sonner";

type Step = "form" | "verify";

function errorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
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
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="relative flex flex-col justify-between bg-ink p-10 text-white lg:w-1/2 lg:p-16">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-white/40 text-xl">
            🌡️
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">Smart Temp Monitor</p>
        </div>

        <Reveal className="my-12 space-y-6 lg:my-0">
          <p className="micro-label flex items-center gap-3 text-white-light">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-chip text-chip" />
            Buat akun baru
          </p>
          <h1 className="heading-page max-w-md uppercase leading-[0.95]">
            Mulai <span className="text-primary">Pantau</span> Sekarang
          </h1>
          <p className="max-w-md text-white-light">
            Daftar dengan email asli, verifikasi lewat kode 6 digit, lalu masuk ke dashboard.
          </p>
        </Reveal>

        <p className="micro-label text-white-light">© 2026 — Smart Temp Monitor</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-16">
        <div className={`auth-swap ${swapClass} w-full max-w-sm`}>
          {step === "form" ? (
            <>
              <div className="mb-8">
                <p className="micro-label mb-2 flex items-center gap-2 text-primary">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  Pendaftaran
                </p>
                <h2 className="heading-page uppercase">Daftar</h2>
                <p className="mt-2 text-sm text-black-light">
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
                  {loading ? "Memproses..." : "Daftar"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-black-light">
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
                <p className="micro-label mb-2 flex items-center gap-2 text-primary">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  Verifikasi
                </p>
                <h2 className="heading-page uppercase">Cek Email</h2>
                <p className="mt-2 text-sm text-black-light">
                  Masukkan kode 6 digit yang dikirim ke <strong>{email}</strong>
                </p>
              </div>

              {demoCode && (
                <div className="mb-5 border border-primary/40 bg-primary/5 p-3 text-sm">
                  <p className="font-medium text-primary">Mode demo (email belum dikonfigurasi)</p>
                  <p className="mt-1 text-black-light">
                    Kode verifikasi kamu: <span className="font-mono text-base font-bold">{demoCode}</span>
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
                  className="text-black-light hover:underline"
                >
                  Ganti email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
