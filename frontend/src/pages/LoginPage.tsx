import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-[14px] border border-[rgba(20,33,61,0.10)] bg-[#f3f5fb] px-[17px] py-[15px] text-[15px] text-[#14213d] outline-none transition-[border-color,box-shadow] focus:border-[#2563f0] focus:shadow-[0_0_0_4px_rgba(37,99,240,0.16)] placeholder:text-[#6b7694]/75";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const swapDir = (location.state as { dir?: string } | null)?.dir;
  const swapClass =
    swapDir === "to-login"
      ? "auth-swap-left"
      : swapDir === "to-register"
        ? "auth-swap-right"
        : "auth-swap-fade";
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [loginMode, setLoginMode] = useState<"email" | "username">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

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
    try {
      const saved = localStorage.getItem("stm:email");
      if (saved) setEmail(saved);
    } catch {
      /* abaikan */
    }
  }, [hydrated, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email.trim(), password, remember);
      navigate("/", { replace: true });
      toast.success("Login berhasil");
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      if (data?.error === "EMAIL_NOT_VERIFIED") {
        toast.error(data.message ?? "Email belum diverifikasi");
        if (loginMode === "email") {
          navigate("/register", { state: { email, dir: "to-register" } });
        }
      } else {
        toast.error(data?.message ?? "Email, username, atau password salah");
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
    <>
      <AuthLayout
        title={
          <>
            Masuk ke
            <br />
            dasbor monitor
            <br />
            kamu
          </>
        }
        sub="Pantau suhu & kelembapan semua sensor dalam satu tempat, kapan saja."
      >
        <div className={`auth-swap ${swapClass}`}>
          <form onSubmit={handleSubmit} className="max-w-[420px]" noValidate>
            <div className="mb-5 flex rounded-full border border-[rgba(20,33,61,0.10)] bg-[#f3f5fb] p-1 text-sm">
              {(
                [
                  ["email", "Email"],
                  ["username", "Username"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLoginMode(mode)}
                  className={`flex-1 cursor-pointer rounded-full px-3 py-2 font-semibold transition ${
                    loginMode === mode
                      ? "bg-[#2563f0] text-white shadow"
                      : "bg-transparent text-[#6b7694] hover:text-[#2563f0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="mb-[7px] block text-[13px] font-semibold text-[#14213d]">
                {loginMode === "email" ? "Email" : "Username"}
              </label>
              <input
                id="email"
                name="email"
                type={loginMode === "email" ? "email" : "text"}
                autoComplete={loginMode === "email" ? "email" : "username"}
                autoCapitalize="none"
                spellCheck={false}
                placeholder={loginMode === "email" ? "nama@email.com" : "misal: budi_99"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="mb-[7px] block text-[13px] font-semibold text-[#14213d]">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-[76px]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-[10px] border-0 bg-transparent px-2.5 py-2 text-[13px] font-semibold text-[#6b7694] hover:text-[#2563f0]"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="mb-[26px] mt-1 flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-[9px] font-medium text-[#6b7694]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => {
                    setRemember(e.target.checked);
                    try {
                      if (e.target.checked) localStorage.setItem("stm:email", email.trim());
                      else localStorage.removeItem("stm:email");
                    } catch {
                      /* abaikan */
                    }
                  }}
                  className="h-4 w-4 accent-[#2563f0]"
                />
                Ingat saya
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetOpen(true);
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-[#2563f0] hover:underline"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[300px] cursor-pointer rounded-full bg-[#2563f0] py-[19px] text-[17px] font-semibold text-white shadow-[0_16px_32px_rgba(37,99,240,0.35)] transition hover:bg-[#1b4fd6] active:translate-y-px disabled:opacity-60"
            >
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-[22px] text-sm font-light text-[#6b7694]">
            {remember ? "cant touch the air." : "Sesi berakhir saat browser ditutup."}
            <br />
            Belum punya akun?{" "}
            <Link
              to="/register"
              state={{ dir: "to-register" }}
              className="font-semibold text-[#2563f0] hover:underline"
            >
              Buat akun gratis
            </Link>
          </p>
        </div>
      </AuthLayout>

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
              <label htmlFor="resetEmail" className="mb-[7px] block text-[13px] font-semibold">
                Email
              </label>
              <div className="flex gap-2">
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="nama@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={resetSendLoading}
                  className="w-fit shrink-0 cursor-pointer rounded-full bg-[#2563f0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b4fd6] disabled:opacity-60"
                >
                  {resetSendLoading ? "Mengirim..." : "Kirim Kode"}
                </button>
              </div>
            </div>
            {resetDemoCode && (
              <div className="border border-[#2563f0]/40 bg-[#2563f0]/5 p-3 text-sm">
                <p className="font-medium text-[#2563f0]">Mode demo (email belum dikonfigurasi)</p>
                <p className="mt-1 text-[#6b7694]">
                  Kode reset: <span className="font-mono text-base font-bold">{resetDemoCode}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="resetCode" className="mb-[7px] block text-[13px] font-semibold">
                Kode Reset
              </label>
              <input
                id="resetCode"
                inputMode="numeric"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="resetPassword" className="mb-[7px] block text-[13px] font-semibold">
                Password Baru
              </label>
              <input
                id="resetPassword"
                type="password"
                placeholder="••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <DialogFooter>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full cursor-pointer rounded-full bg-[#2563f0] py-[15px] text-sm font-semibold text-white transition hover:bg-[#1b4fd6] disabled:opacity-60"
              >
                {resetLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}