import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Step = "form" | "code" | "password";

function errorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

function PasswordToggle({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
          aria-label={show ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
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
  const verifyCode = useAuthStore((s) => s.verifyCode);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const loading = useAuthStore((s) => s.loading);

  const [step, setStep] = useState<Step>(presetEmail ? "code" : "form");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<{ checking?: boolean; taken?: boolean; invalid?: boolean }>({});
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) navigate("/", { replace: true });
  }, [hydrated, token, navigate]);

  // Cek ketersediaan username langsung saat mengetik (debounce 400ms).
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
    setUsernameState({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<{ available: boolean; valid: boolean }>("/auth/check-username", {
          params: { username: val },
        });
        setUsernameState(data.valid ? { taken: !data.available } : { invalid: true });
      } catch {
        setUsernameState({});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameState.taken) {
      toast.error("Username telah digunakan");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(username.trim())) {
      toast.error("Username 3-20 karakter: huruf, angka, titik, garis bawah, atau strip");
      return;
    }
    try {
      const res = await register(name, username.trim(), email);
      setDemoCode(res.code ?? null);
      setEmail(res.email);
      setStep("code");
      toast.success(
        res.emailSent
          ? "Kode verifikasi dikirim ke email kamu"
          : "Akun dibuat. Masukkan kode verifikasi di bawah"
      );
    } catch (err) {
      toast.error(errorMessage(err, "Gagal mendaftar"));
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode(email, code);
      setStep("password");
      toast.success("Kode benar. Sekarang buat password kamu.");
    } catch (err) {
      toast.error(errorMessage(err, "Kode verifikasi salah"));
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
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
      await verifyEmail(email, code, password);
      toast.success("Email terverifikasi. Selamat datang!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Gagal menyelesaikan pendaftaran"));
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

  const stepInfo: Record<Step, { badge: string; title: string; desc: string }> = {
    form: { badge: "Pendaftaran", title: "Daftar", desc: "Mulai dengan nama dan email aktif" },
    code: {
      badge: "Verifikasi",
      title: "Cek Email",
      desc: `Masukkan kode 6 digit yang dikirim ke ${email || "email kamu"}`,
    },
    password: {
      badge: "Selesai",
      title: "Buat Password",
      desc: "Terakhir, tentukan password untuk akunmu",
    },
  };

  return (
    <AuthLayout
      title={stepInfo[step].title}
      subtitle={stepInfo[step].desc}
      swapClass={swapClass}
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            to="/login"
            state={{ dir: "to-login" }}
            className="font-semibold text-[#3d41ad] hover:underline"
          >
            Login
          </Link>
        </>
      }
    >
      {step === "form" && (
                <>
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
                      <Label htmlFor="regUsername">Username</Label>
                      <Input
                        id="regUsername"
                        placeholder="misal:antek-antek aseng"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
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
                      {(usernameState.taken || usernameState.invalid) &&
                        !usernameState.checking && (
                          <p className="text-xs font-medium text-destructive">
                            {usernameState.taken ? "Username telah digunakan" : "3-20 karakter: huruf, angka, titik, garis bawah, atau strip"}
                          </p>
                        )}
                      {usernameState.checking && (
                        <p className="text-xs text-muted-foreground">Memeriksa ketersediaan...</p>
                      )}
                      {!usernameState.taken && !usernameState.invalid && !usernameState.checking && username.trim().length >= 3 && (
                        <p className="text-xs font-medium text-emerald-600">Username tersedia</p>
                      )}
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
                    <Button type="submit" variant="default" className="w-full" disabled={loading}>
                      {loading ? "Mengirim..." : "Kirim Kode Verifikasi"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Kode verifikasi akan dikirim ke emailmu setelah menekan tombol di atas.
                    </p>
                  </form>
                </>
              )}

              {step === "code" && (
                <>
                  {demoCode && (
                    <div className="mb-5 border border-primary/40 bg-primary/5 p-3 text-sm">
                      <p className="font-medium text-primary">Mode demo (email belum dikonfigurasi)</p>
                      <p className="mt-1 text-black-light">
                        Kode verifikasi kamu:{" "}
                        <span className="font-mono text-base font-bold">{demoCode}</span>
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="space-y-5">
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
                      {loading ? "Memeriksa..." : "Lanjut"}
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

              {step === "password" && (
                <>
                  <form onSubmit={handleFinish} className="space-y-5">
                    <PasswordToggle
                      id="regPassword"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="new-password"
                    />
                    <PasswordToggle
                      id="regConfirm"
                      label="Konfirmasi Password"
                      value={confirm}
                      onChange={setConfirm}
                      autoComplete="new-password"
                    />
                    <Button type="submit" variant="default" className="w-full" disabled={loading}>
                      {loading ? "Menyelesaikan..." : "Buat Akun & Masuk"}
                    </Button>
                  </form>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep("code")}
                      className="text-muted-foreground hover:underline"
                    >
                      Ubah kode
                    </button>
                  </div>
                </>
              )}
    </AuthLayout>
  );
}