import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Cpu, Download, PlayCircle, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InfoKey = "cara" | "fitur" | "perangkat";

const INFO: Record<InfoKey, { title: string; body: ReactNode }> = {
  cara: {
    title: "Cara kerja",
    body: (
      <ul className="list-decimal space-y-2 pl-5">
        <li>Pasang sensor suhu dan kelembapan di ruangan yang dipantau.</li>
        <li>Sensor mengirim data ke server secara berkala melalui MQTT.</li>
        <li>Masuk ke dasbor untuk memantau, dan terima notifikasi email saat ambang batas terlampaui.</li>
      </ul>
    ),
  },
  fitur: {
    title: "Fitur",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Dashboard suhu dan kelembapan real-time lewat WebSocket.</li>
        <li>Grafik riwayat 1 jam sampai 7 hari.</li>
        <li>Alert otomatis saat melewati ambang batas.</li>
        <li>Manajemen sensor dan ambang batas.</li>
        <li>Riwayat alert dan status perangkat.</li>
      </ul>
    ),
  },
  perangkat: {
    title: "Perangkat",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Mikrokontroler dengan sensor suhu dan kelembapan, misalnya DHT11 atau DHT22.</li>
        <li>Laptop atau komputer sebagai pengirim data sensor.</li>
        <li>Akses dari desktop, HP, atau aplikasi Android.</li>
      </ul>
    ),
  },
};

const FEATURES = [
  "Monitoring real-time lewat WebSocket",
  "Riwayat 1 jam sampai 7 hari",
  "Alert otomatis saat melewati ambang batas",
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  swapClass?: string;
}

export function AuthLayout({ title, subtitle, children, footer, swapClass }: AuthLayoutProps) {
  const [info, setInfo] = useState<InfoKey | null>(null);

  const infoButton = (key: InfoKey, label: string, icon: ReactNode) => (
    <button
      key={key}
      type="button"
      onClick={() => setInfo(key)}
      className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-white/15 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/20"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f1f3f9] px-4 py-8">
      <main className="w-[min(1320px,100%)] overflow-hidden rounded-[30px] bg-[#262a4a] p-[clamp(16px,2.2vw,28px)] shadow-[0_30px_80px_rgba(38,42,74,0.28)]">
        <div className="grid items-center gap-10 min-[880px]:grid-cols-[1.08fr_0.92fr] min-[1200px]:gap-14">
          <section className="text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#4448b8] text-[15px] font-extrabold text-white">
                ST
              </span>
              <span className="text-[15px] font-bold tracking-[-0.01em]">Smart Temp Monitor</span>
            </div>

            <h1 className="mt-10 text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.12] tracking-[-0.02em]">
              Pantau Suhu dan Kelembapan dari Satu Tempat
            </h1>
            <p className="mt-4 max-w-[42ch] text-[14.5px] leading-relaxed text-white/70">
              Data sensor masuk lewat MQTT, disimpan di database, lalu dikirim ke dasbor secara
              langsung. Tidak ada angka yang dibuat-buat.
            </p>

            <div className="mt-8 max-w-[380px] rounded-[18px] border border-white/12 bg-white/[0.07] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-white/70">Ringkasan monitoring</span>
                <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#37bc99]/20 px-2 py-1 text-[11.5px] font-bold text-[#7fe3c6]">
                  <i className="h-1.5 w-1.5 rounded-full bg-[#37bc99]" />
                  Live
                </span>
              </div>
              <svg
                viewBox="0 0 120 64"
                className="mt-4 h-[72px] w-full"
                role="img"
                aria-label="Ilustrasi meter suhu dengan zona dingin, aman, dan panas"
              >
                <path
                  d="M10 58 A50 50 0 0 1 110 58"
                  pathLength={100}
                  fill="none"
                  stroke="#6fb6f5"
                  strokeOpacity={0.55}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray="26 74"
                />
                <path
                  d="M10 58 A50 50 0 0 1 110 58"
                  pathLength={100}
                  fill="none"
                  stroke="#37bc99"
                  strokeOpacity={0.75}
                  strokeWidth={11}
                  strokeLinecap="butt"
                  strokeDasharray="32 68"
                  strokeDashoffset={-26}
                />
                <path
                  d="M10 58 A50 50 0 0 1 110 58"
                  pathLength={100}
                  fill="none"
                  stroke="#ff9aa3"
                  strokeOpacity={0.6}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray="24 76"
                  strokeDashoffset={-58}
                />
              </svg>
              <div className="mt-3 flex h-10 items-end gap-2">
                {[38, 62, 46, 74, 54, 88, 66].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-[3px] bg-white/25"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <ul className="mt-8 space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[#9aa2ff]" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {infoButton("cara", "Cara kerja", <PlayCircle className="h-4 w-4" />)}
              {infoButton("fitur", "Fitur", <ListChecks className="h-4 w-4" />)}
              {infoButton("perangkat", "Perangkat", <Cpu className="h-4 w-4" />)}
              <a
                href="https://github.com/Udean-inrahim/tugas-bu-dian/releases/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#4448b8] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#5256c9]"
              >
                <Download className="h-4 w-4" />
                Unduh APK
              </a>
            </div>
          </section>

          <section className="auth-card rounded-[22px] border border-[#eceef5] bg-white p-[clamp(24px,2.6vw,40px)] shadow-[0_18px_45px_rgba(20,24,50,0.18)]">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#4448b8] text-[12px] font-extrabold text-white">
                ST
              </span>
              <span className="text-[13.5px] font-bold text-[#272a3b]">Smart Temp</span>
            </div>
            <h2 className="mt-6 text-[clamp(24px,2.6vw,30px)] font-extrabold leading-tight tracking-[-0.02em] text-[#272a3b]">
              {title}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#616879]">{subtitle}</p>

            <div className={`auth-swap mt-7 ${swapClass ?? ""}`}>{children}</div>

            <div className="mt-7 border-t border-dashed border-[#e2e5ee] pt-5 text-center text-[13.5px] text-[#616879]">
              {footer}
            </div>
          </section>
        </div>
      </main>

      <Dialog open={info !== null} onOpenChange={(open) => !open && setInfo(null)}>
        <DialogContent className="rounded-[20px] border-[#eceef5] bg-white">
          <DialogHeader>
            <DialogTitle>{info ? INFO[info].title : ""}</DialogTitle>
            <DialogDescription asChild>
              <div className="text-[13.5px] leading-relaxed text-[#616879]">
                {info ? INFO[info].body : null}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AuthFooterLink({ to, state, children }: { to: string; state?: unknown; children: ReactNode }) {
  return (
    <Link to={to} state={state} className="font-semibold text-[#3d41ad] hover:underline">
      {children}
    </Link>
  );
}
