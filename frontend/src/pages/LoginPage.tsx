import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";

function errorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

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
      toast.error(errorMessage(err, "Gagal mereset password"));
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
      toast.error(errorMessage(err, "Gagal mengirim kode"));
    } finally {
      setResetSendLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Selamat Datang"
        subtitle="Masuk untuk melanjutkan ke dasbor monitor kamu."
        swapClass={swapClass}
        footer={
          <>
            Belum punya akun?{" "}
            <Link
              to="/register"
              state={{ dir: "to-register" }}
              className="font-semibold text-[#3d41ad] hover:underline"
            >
              Buat akun gratis
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="mb-1 flex gap-1 rounded-[12px] border border-[#eceef5] bg-[#f1f3f9] p-1 text-[13.5px]">
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
                        className={`flex-1 cursor-pointer rounded-[9px] px-3 py-2 font-semibold transition-colors ${
                          loginMode === mode
                            ? "bg-white text-[#3d41ad] shadow-[0_2px_8px_rgba(72,78,105,0.1)]"
                            : "bg-transparent text-[#545b6c] hover:text-[#3d41ad]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {loginMode === "email" ? "Email" : "Username"}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type={loginMode === "email" ? "email" : "text"}
                      autoComplete={loginMode === "email" ? "email" : "username"}
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={
                        loginMode === "email" ? "nama@email.com" : "misal: prabowo_gaming969"
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Kata sandi</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Minimal 8 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                    <label className="flex cursor-pointer items-center gap-[9px] font-medium text-muted-foreground">
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
                      className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  <Button type="submit" variant="default" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Memproses…" : "Masuk"}
                  </Button>
                </form>
                {remember && (
                  <p className="mt-4 text-center text-[12.5px] text-[#6b7280]">
                    heiiiiii antek-antek aseng.
                  </p>
                )}
      </AuthLayout>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="rounded-[20px] border-[#eceef5] bg-white">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
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
                    onClick={handleSendResetCode}
                    disabled={resetSendLoading}
                    className="w-fit shrink-0"
                  >
                    {resetSendLoading ? "Mengirim..." : "Kirim Kode"}
                  </Button>
                </div>
              </div>
              {resetDemoCode && (
                <div className="border border-primary/40 bg-primary/5 p-3 text-sm">
                  <p className="font-medium text-primary">Mode demo (email belum dikonfigurasi)</p>
                  <p className="mt-1 text-muted-foreground">
                    Kode reset: <span className="font-mono text-base font-bold">{resetDemoCode}</span>
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Menyimpan..." : "Simpan Password Baru"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </>
  );
}