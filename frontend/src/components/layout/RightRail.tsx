import { useNavigate } from "react-router-dom";
import { Search, Radio, LayoutDashboard, Activity, History as HistoryIcon, Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSensors } from "@/hooks/useSensors";
import { useSettings } from "@/hooks/useSettings";
import { useAlerts } from "@/hooks/useAlerts";
import { formatTime, dotBg } from "@/lib/threshold";

const QUICK = [
  { label: "Dasbor", to: "/", icon: LayoutDashboard },
  { label: "Monitoring", to: "/monitoring", icon: Activity },
  { label: "Riwayat", to: "/history", icon: HistoryIcon },
  { label: "Alert", to: "/alerts", icon: Bell },
];

export function RightRail() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sensors } = useSensors();
  const { settings } = useSettings();
  const { alerts } = useAlerts({ status: "ACTIVE", limit: 3 });

  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;

  return (
    <div className="flex h-full flex-col border-l border-line bg-card px-4 py-5">
      <div className="mb-5 flex gap-2">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-[9px] bg-[#f2f5f7] px-3 text-[11px] text-[#8b8f9a] dark:bg-white/5 dark:text-slate-400">
          <Search className="h-3.5 w-3.5" />
          Cari sensor…
        </div>
        <button
          type="button"
          onClick={() => navigate("/monitoring")}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-[9px] bg-[#d2f6f4] text-[13px] text-[#536d74] transition hover:brightness-95 dark:bg-cyan-500/15 dark:text-cyan-300"
          title="Monitoring"
        >
          ⌕
        </button>
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-[9px] bg-[#f5d8e6] text-[13px] text-[#7a5468] transition hover:brightness-95 dark:bg-pink-500/15 dark:text-pink-300"
          title="Alert"
        >
          ♢
        </button>
      </div>

      <div className="text-center">
        <div className="brand-gradient mx-auto grid h-[62px] w-[62px] place-items-center rounded-full text-[22px] font-bold text-white shadow-[0_2px_10px_rgba(83,110,232,0.4)] ring-4 ring-white dark:ring-[#1b2740]">
          {user?.name?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <h4 className="mt-2.5 text-[13px] font-bold text-[#695070] dark:text-indigo-200">{user?.name ?? "User"}</h4>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="mt-1 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[10px] font-medium text-[#777] hover:text-brand-danger"
        >
          <LogOut className="h-3 w-3" />
          Keluar
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[10px] font-medium text-[#888] dark:text-slate-400">Sensor Online</p>
        <p className="mt-1 text-[26px] font-extrabold leading-none tracking-[-0.02em] text-ink">
          {online}
          <span className="text-sm font-semibold text-[#8b8f9a] dark:text-slate-400">/{activeSensors.length}</span>
        </p>
        <p className="mt-1 text-[9px] text-[#8b8f9a] dark:text-slate-400">
          {sensors.length} sensor terdaftar
        </p>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-[18px] p-4 text-left text-white [background:linear-gradient(145deg,#171a28_10%,#111_58%,#0d6a4e)]">
        <small className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/60">
          Ambang batas
        </small>
        <div className="mt-3 space-y-2 text-[11px] font-semibold">
          <div className="flex justify-between">
            <span className="text-white/70">Suhu</span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-full bg-[#38c8a5]" />
              {settings?.minTemperature?.toFixed(1) ?? "—"} –{" "}
              {settings?.maxTemperature?.toFixed(1) ?? "—"}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Lembap</span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-full bg-[#36c9d0]" />
              {settings?.minHumidity?.toFixed(0) ?? "—"} –{" "}
              {settings?.maxHumidity?.toFixed(0) ?? "—"}%
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -bottom-10 h-24 w-24 rounded-full bg-[#a9f0f0]/50 blur-2xl" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q.to}
            type="button"
            onClick={() => navigate(q.to)}
            title={q.label}
            className="grid h-9 cursor-pointer place-items-center rounded-lg bg-[#edf0ff] text-brand-blue transition hover:brightness-95 dark:bg-white/10 dark:text-indigo-200"
          >
            <q.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-ink">Alert terbaru</h3>
          <button
            type="button"
            onClick={() => navigate("/alerts")}
            className="cursor-pointer rounded-lg bg-[#e9edff] px-2 py-1 text-[9px] font-semibold text-brand-blue hover:bg-[#dfe5ff] dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/15"
          >
            Lihat semua
          </button>
        </div>
        <div className="space-y-2">
          {alerts.length === 0 && (
            <p className="rounded-xl bg-[#e8f7f4] px-3 py-4 text-center text-[11px] font-medium text-[#278f7e] dark:bg-emerald-500/10 dark:text-emerald-300">
              Tidak ada alert aktif ✓
            </p>
          )}
          {alerts.slice(0, 3).map((a) => {
            const dot = dotBg[a.severity === "CRITICAL" ? "red" : "yellow"];
            return (
              <div key={a.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-ink">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#dff5f8] dark:bg-cyan-500/15">
                    <Radio className="h-3 w-3 text-[#536d74] dark:text-cyan-300" />
                  </span>
                  <span className="truncate">{a.sensor?.name ?? a.sensor?.sensorCode ?? "Sensor"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#b9f2e7] px-2 py-1 text-[9px] font-bold text-[#278f7e] dark:bg-emerald-500/15 dark:text-emerald-300">
                  <i className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {a.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

        <p className="mt-3 text-center text-[9px] text-[#a5a8b0] dark:text-slate-500">
          Pembaruan terakhir {formatTime(new Date().toISOString())} · Smart Temp v{__APP_VERSION__}
        </p>
    </div>
  );
}