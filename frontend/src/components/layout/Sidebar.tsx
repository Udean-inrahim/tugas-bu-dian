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
    <div className="flex h-full flex-col border-r border-[#e9ebf2] bg-white">
      <div className="flex items-center gap-2.5 px-5 pt-7 pb-7">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#4448b8] text-[15px] font-bold text-white">
          ST
        </span>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold leading-none tracking-[-0.01em] text-[#272a3b]">
            Smart Temp
          </p>
          <p className="mt-1 text-[11.5px] font-medium text-[#6b7280]">Monitoring</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[13px] px-3 py-[11px] text-[13.5px] font-semibold transition-colors",
                isActive
                  ? "bg-[#3d41ad] text-white shadow-[0_12px_25px_rgba(61,65,173,0.25)]"
                  : "text-[#626875] hover:bg-[#f1f3f9] hover:text-[#3d41ad]"
              )
            }
          >
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-4">
        <div className="rounded-[16px] border border-[#eceef5] bg-[#f8f9fc] p-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#37bc99]" />
            <span className="text-[12.5px] font-semibold text-[#545b6c]">Sensor aktif</span>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-[7px] px-2 py-0.5 text-[11px] font-bold",
                online > 0 ? "bg-[#e6f7f1] text-[#1e9e7e]" : "bg-[#ffe9eb] text-[#d64550]"
              )}
            >
              <i className="h-1.5 w-1.5 rounded-full bg-current" />
              {online > 0 ? "LIVE" : "OFF"}
            </span>
          </div>
          <p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em] text-[#272a3b]">
            {online}
            <span className="text-[15px] font-semibold text-[#6b7280]">/{activeSensors.length}</span>
          </p>
          <p className="mt-1.5 text-[12px] text-[#616879]">sensor terhubung dari total aktif</p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#282b3d] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#4549b6]"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-[#eceef5] pt-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#edf0fa] text-[13px] font-bold text-[#3d41ad]">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#272a3b]">{user?.name ?? "User"}</p>
            <p className="text-[11.5px] font-medium text-[#6b7280]">{user?.role ?? "Admin"}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-[7px] bg-[#f1f3f9] px-2 py-1 text-[11px] font-semibold text-[#616879]">
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </div>
  );
}
