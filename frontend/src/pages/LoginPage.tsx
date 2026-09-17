import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    } catch {
      toast.error("Email atau password salah");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Left — black brand section */}
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
            Pantauan real-time
          </p>
          <h1 className="heading-page max-w-md uppercase leading-[0.95]">
            Smart <span className="text-primary">Temperature</span> Monitoring
          </h1>
          <p className="max-w-md text-white-light">
            Pantau suhu dan kelembapan sensor secara langsung, tanpa lelah.
          </p>
        </Reveal>

        <p className="micro-label text-white-light">© 2026 — Smart Temp Monitor</p>
      </div>

      {/* Right — login form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-16">
        <Reveal delay={150} className="w-full max-w-sm">
          <div className="mb-8">
            <p className="micro-label mb-2 flex items-center gap-2 text-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Akses masuk
            </p>
            <h2 className="heading-page uppercase">Login</h2>
            <p className="mt-2 text-sm text-black-light">Masuk ke dashboard monitoring</p>
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
            <Button type="submit" variant="default" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
            <p className="text-center text-xs uppercase tracking-wide text-black-light">
              Demo: admin@example.com / admin123
            </p>
          </form>
        </Reveal>
      </div>
    </div>
  );
}