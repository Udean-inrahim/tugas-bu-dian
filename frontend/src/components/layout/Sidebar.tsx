import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  History,
  Bell,
  Settings,
  LogOut,
  Radio,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSensors } from "@/hooks/useSensors";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dasbor", icon: LayoutDashboard },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/sensors", label: "Sensor", icon: Cpu },
  { to: "/history", label: "Riwayat", icon: History },
  { to: "/alerts", label: "Alert", icon: Bell },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { sensors } = useSensors();
  const activeSensors = sensors.filter((s) => s.isActive);
  const online = activeSensors.filter((s) => s.status === "ONLINE").length;

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col border-r border-line bg-card">
      <div className="flex items-center gap-2.5 px-5 pt-7 pb-8">
        <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px] font-bold text-white">
          ST
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold leading-none tracking-[-0.02em] text-ink">
            Smart Temp
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Monitoring
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-[13px] font-semibold transition dark:text-slate-300",
                isActive
                  ? "bg-[#edf1ff] text-brand-blue dark:bg-white/10 dark:text-indigo-200"
                  : "text-[#626875] hover:bg-[#edf1ff]/60 hover:text-brand-blue dark:hover:bg-white/10 dark:hover:text-indigo-200"
              )
            }
          >
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl p-4 pb-5 text-white [background:linear-gradient(135deg,#22242b,#48416e)]">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#ff8b8e]" />
            <span className="text-[11px] font-semibold text-white/85">
              Sensor aktif
            </span>
            <span className="ml-auto rounded-full bg-[#38c8a5]/20 px-2 py-0.5 text-[9px] font-bold text-[#5fe0c0]">
              LIVE
            </span>
          </div>
          <p className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em]">
            {online}
            <span className="text-sm font-semibold text-white/60">/{activeSensors.length}</span>
          </p>
          <p className="mt-1.5 text-[10px] text-white/60">
            sensor terhubung dari total aktif
          </p>
          <div className="pointer-events-none absolute -right-6 -bottom-8 h-16 w-16 rounded-full bg-[#a9f0f0]/40 blur-2xl" />
        </div>

        <div className="mt-4 flex gap-2">
          <ThemeToggle className="shrink-0" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-blue py-2.5 text-[12px] font-semibold text-white transition hover:bg-brand-blue/90"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-4">
          <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-ink">{user?.name ?? "User"}</p>
            <p className="text-[10px] font-medium text-muted-foreground">
              {user?.role ?? "Admin"}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[#edf1ff] px-2 py-1 text-[9px] font-semibold text-brand-blue dark:bg-white/10 dark:text-indigo-200">
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </div>
  );
}