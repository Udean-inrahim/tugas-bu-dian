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
    <div className="flex h-full flex-col border-l border-[#e9ebf2] bg-white px-4 py-5">
      <div className="mb-5 flex gap-2">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-[10px] border border-[#eceef5] bg-[#f8f9fc] px-3 text-[12.5px] text-[#6b7280]">
          <Search className="h-4 w-4" />
          Cari sensor
        </div>
        <button
          type="button"
          onClick={() => navigate("/monitoring")}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border border-[#eceef5] bg-white text-[#3d41ad] transition-colors hover:bg-[#f1f3f9]"
          title="Monitoring"
          aria-label="Buka monitoring"
        >
          <Activity className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border border-[#eceef5] bg-white text-[#3d41ad] transition-colors hover:bg-[#f1f3f9]"
          title="Alert"
          aria-label="Buka alert"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      <div className="text-center">
        <div className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-[18px] bg-[#edf0fa] text-[24px] font-bold text-[#3d41ad]">
          {user?.name?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <h4 className="mt-2.5 text-[14px] font-bold text-[#272a3b]">{user?.name ?? "User"}</h4>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="mt-1 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[12px] font-medium text-[#6b7280] transition-colors hover:text-[#d64550]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>

      <div className="mt-6 border-t border-dashed border-[#e2e5ee] pt-5 text-center">
        <p className="text-[12px] font-medium text-[#616879]">Sensor Online</p>
        <p className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[#272a3b]">
          {online}
          <span className="text-[15px] font-semibold text-[#6b7280]">/{activeSensors.length}</span>
        </p>
        <p className="mt-1 text-[11.5px] text-[#6b7280]">{sensors.length} sensor terdaftar</p>
      </div>

      <div className="mt-5 rounded-[16px] border border-[#eceef5] bg-[#f8f9fc] p-4 text-left">
        <p className="text-[12px] font-semibold text-[#545b6c]">Ambang batas</p>
        <div className="mt-3 space-y-2 text-[12.5px] font-semibold text-[#3b4055]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#616879]">Suhu</span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-full bg-[#37bc99]" />
              {settings?.minTemperature?.toFixed(1) ?? "-"} - {settings?.maxTemperature?.toFixed(1) ?? "-"}
              &deg;C
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#616879]">Lembap</span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-2 w-2 rounded-full bg-[#6fb6f5]" />
              {settings?.minHumidity?.toFixed(0) ?? "-"} - {settings?.maxHumidity?.toFixed(0) ?? "-"}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q.to}
            type="button"
            onClick={() => navigate(q.to)}
            title={q.label}
            aria-label={q.label}
            className="grid h-10 cursor-pointer place-items-center rounded-[10px] border border-[#eceef5] bg-white text-[#3d41ad] transition-colors hover:bg-[#f1f3f9]"
          >
            <q.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[13.5px] font-bold text-[#272a3b]">Alert terbaru</h3>
          <button
            type="button"
            onClick={() => navigate("/alerts")}
            className="cursor-pointer rounded-[8px] bg-[#f1f3f9] px-2.5 py-1 text-[11.5px] font-semibold text-[#3d41ad] transition-colors hover:bg-[#e7eaf4]"
          >
            Lihat semua
          </button>
        </div>
        <div className="space-y-2">
          {alerts.length === 0 && (
            <p className="rounded-[12px] border border-[#eceef5] bg-[#f8f9fc] px-3 py-4 text-center text-[12px] font-medium text-[#1e9e7e]">
              Tidak ada alert aktif
            </p>
          )}
          {alerts.slice(0, 3).map((a) => {
            const dot = dotBg[a.severity === "CRITICAL" ? "red" : "yellow"];
            return (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 border-b border-[#f1f3f9] pb-2 text-[12px] last:border-0"
              >
                <span className="flex min-w-0 items-center gap-2 font-semibold text-[#3b4055]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#f1f3f9]">
                    <Radio className="h-3.5 w-3.5 text-[#3d41ad]" />
                  </span>
                  <span className="truncate">{a.sensor?.name ?? a.sensor?.sensorCode ?? "Sensor"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-[7px] bg-[#f7f8fc] px-2 py-1 text-[11.5px] font-bold text-[#545b6c]">
                  <i className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {a.value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-[#6b7280]">
        Pembaruan terakhir {formatTime(new Date().toISOString())} - Smart Temp v{__APP_VERSION__}
      </p>
    </div>
  );
}
