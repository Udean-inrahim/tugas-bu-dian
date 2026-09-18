import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, BellRing, Globe, Clock } from "lucide-react";

interface AuthLayoutProps {
  title: ReactNode;
  sub: ReactNode;
  children: ReactNode;
  cta: { to: string; label: string; state?: unknown };
}

export function AuthLayout({ title, sub, children, cta }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-dvh flex items-center justify-center overflow-x-hidden px-4 py-8"
      style={{
        background:
          "radial-gradient(900px 620px at 12% 8%, #f7f3ff 0%, transparent 60%), radial-gradient(900px 700px at 88% 12%, #e8f0ff 0%, transparent 62%), #eef2ff",
      }}
    >
      {/* blob & titik dekoratif */}
      <div aria-hidden className="pointer-events-none absolute z-0">
        <span className="absolute left-[52%] top-[-90px] h-[230px] w-[230px] rounded-full bg-[#8b5cf6] opacity-85" />
        <span className="absolute bottom-[-130px] left-[-90px] h-[340px] w-[340px] rounded-full bg-[#f5a623] opacity-80" />
        <span className="absolute bottom-[-10px] left-[120px] h-[150px] w-[150px] rounded-full bg-[#f5a623] opacity-35" />
        <span className="absolute left-[6%] top-[-40px] h-[190px] w-[190px] rounded-full bg-white opacity-50" />
        <span className="absolute left-[4%] top-[120px] h-[60px] w-[60px] rounded-full bg-white opacity-70" />
        <span className="absolute left-[47%] top-[26%] h-4 w-4 rounded-full bg-[#ec4b9b]" />
        <span className="absolute right-[6%] top-[64%] h-3.5 w-3.5 rounded-full bg-[#ec4b9b]" />
        <span className="absolute bottom-[12%] left-[22%] h-[18px] w-[18px] rounded-full bg-[#16c79a]" />
        <span className="absolute bottom-[-34px] right-[34%] h-[86px] w-[86px] rounded-full bg-[#2563f0]" />
        <span className="absolute right-[14%] top-[5%] h-[26px] w-[26px] rounded-full bg-white opacity-75" />
      </div>

      <main className="relative z-10 w-[min(1120px,100%)] rounded-[34px] border border-white/60 bg-white/60 px-[clamp(20px,4vw,48px)] pb-[clamp(34px,5vw,54px)] pt-[26px] shadow-[0_40px_90px_rgba(31,45,90,0.18)] backdrop-blur-[22px]">
        <nav className="mb-[clamp(24px,4vw,44px)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-bold tracking-[0.06em] text-[#14213d]">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#8b5cf6] text-[15px] font-bold text-white">
              ST
            </span>
            SMART TEMP
          </div>
          <div className="hidden min-[760px]:flex gap-[clamp(18px,3vw,38px)] text-sm font-medium text-[#6b7694]">
            <a href="#" className="hover:text-[#2563f0]">Cara kerja</a>
            <a href="#" className="hover:text-[#2563f0]">Fitur</a>
            <a href="#" className="hover:text-[#2563f0]">Perangkat</a>
          </div>
          <Link
            to={cta.to}
            state={cta.state}
            className="rounded-full bg-[#2563f0] px-7 py-[11px] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,240,0.32)] transition hover:bg-[#1b4fd6]"
          >
            {cta.label}
          </Link>
        </nav>

        <div className="grid grid-cols-1 items-center gap-[clamp(26px,4vw,56px)] min-[900px]:grid-cols-[1.02fr_0.98fr]">
          <section>
            <h1 className="mb-[14px] text-[clamp(34px,5.4vw,58px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#14213d]">
              {title}
            </h1>
            <p className="mb-[28px] max-w-[40ch] text-[15px] leading-[1.7] text-[#6b7694]">{sub}</p>
            {children}
          </section>

          <aside aria-hidden className="relative min-h-[440px] max-[900px]:flex max-[900px]:min-h-0 max-[900px]:flex-wrap max-[900px]:justify-center max-[900px]:gap-3.5">
            <div className="absolute top-0 right-[6%] w-[210px] rounded-[20px] bg-white/90 p-[18px_22px] shadow-[0_18px_40px_rgba(31,45,90,0.12)] max-[900px]:static max-[900px]:max-w-[230px] max-[900px]:flex-[1_1_180px]">
              <div className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-[#6b7694]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#16c79a] text-white">
                  <Activity className="h-4 w-4" />
                </span>
                Data real-time
              </div>
              <p className="text-[clamp(26px,3vw,34px)] font-bold leading-[1.1] tracking-[-0.02em]">5 mnt</p>
              <p className="mt-1.5 text-[12.5px] text-[#6b7694]">interval pembaruan data</p>
            </div>

            <div className="absolute top-[96px] left-0 w-[216px] rounded-[20px] bg-white/90 p-[18px_22px] shadow-[0_18px_40px_rgba(31,45,90,0.12)] max-[900px]:static max-[900px]:max-w-[230px] max-[900px]:flex-[1_1_180px]">
              <div className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-[#6b7694]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#2563f0] text-white">
                  <BellRing className="h-4 w-4" />
                </span>
                Notifikasi email
              </div>
              <p className="text-[clamp(26px,3vw,34px)] font-bold leading-[1.1] tracking-[-0.02em]">24/7</p>
              <p className="mt-1.5 text-[12.5px] text-[#6b7694]">alert otomatis saat melewati ambang</p>
            </div>

            <div className="absolute top-[168px] right-[2%] w-[210px] rounded-[20px] bg-white/90 p-[18px_22px] shadow-[0_18px_40px_rgba(31,45,90,0.12)] max-[900px]:static max-[900px]:max-w-[230px] max-[900px]:flex-[1_1_180px]">
              <div className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-[#6b7694]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#f2385a] text-white">
                  <Globe className="h-4 w-4" />
                </span>
                Akses di mana saja
              </div>
              <p className="text-[clamp(26px,3vw,34px)] font-bold leading-[1.1] tracking-[-0.02em]">Web + APK</p>
              <p className="mt-1.5 text-[12.5px] text-[#6b7694]">desktop, HP, dan Android</p>
            </div>

            <div className="absolute top-[300px] left-[4%] w-[220px] rounded-[20px] bg-white/90 p-[18px_22px] shadow-[0_18px_40px_rgba(31,45,90,0.12)] max-[900px]:static max-[900px]:max-w-[230px] max-[900px]:flex-[1_1_180px]">
              <div className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-[#6b7694]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#8b5cf6] text-white">
                  <Clock className="h-4 w-4" />
                </span>
                Aktif 24 jam
              </div>
              <div className="mt-2.5 flex h-[76px] items-end gap-[10px]">
                {[38, 74, 52, 60, 44, 88].map((h, i) => (
                  <span key={i} className="flex-1 rounded-[2px] bg-[#1f4b99]" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}