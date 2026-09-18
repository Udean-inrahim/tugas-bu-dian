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
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">
          ST
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">Smart Temp</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Monitoring
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:bg-accent hover:text-ink"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{user?.name ?? "User"}</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {user?.role ?? "Admin"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent hover:text-ink"
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