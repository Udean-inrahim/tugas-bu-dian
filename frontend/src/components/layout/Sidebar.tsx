import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  History,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/monitoring", label: "Monitoring", icon: Activity },
  { to: "/sensors", label: "Sensors", icon: Cpu },
  { to: "/history", label: "History", icon: History },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-full w-[260px] flex-col bg-ink text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-6">
        <span className="flex h-9 w-9 items-center justify-center border border-white/40 text-lg">
          🌡️
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Smart Temp
          </p>
          <p className="micro-label text-white-light">Monitoring</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "link link_white flex items-center gap-3 px-2 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors",
                isActive ? "active text-white" : "text-white-light hover:text-white"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 text-xs font-semibold uppercase">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-wide">
                {user?.name ?? "User"}
              </p>
              <p className="micro-label text-white-light">Role: {user?.role ?? "Admin"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              logout();
              onClose?.();
            }}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}