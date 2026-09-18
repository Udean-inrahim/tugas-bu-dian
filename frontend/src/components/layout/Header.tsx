import { useEffect, useState } from "react";
import { Menu, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [lastUpdate, setLastUpdate] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="heading-section whitespace-nowrap">Smart Temp Monitor</h1>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-muted-foreground md:flex">
          <RefreshCw className="h-3 w-3" />
          Update {lastUpdate}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full border border-border px-2"
            >
              <div className="brand-gradient flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <span className="hidden text-sm font-semibold sm:inline">{user?.name ?? "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-semibold uppercase tracking-wide">{user?.name ?? "User"}</p>
              <p className="text-xs font-normal text-black-light">{user?.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {user?.role ?? "ADMIN"}
              </Badge>
              <span>Role</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}