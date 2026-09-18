import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener("stm:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("stm:unauthorized", handleUnauthorized);
  }, [navigate]);

  return (
    <div className="relative h-screen overflow-hidden px-3 py-3 lg:px-5 lg:py-4">
      <div className="mx-auto flex h-full max-w-[1360px] overflow-hidden rounded-[24px] bg-card shadow-[0_24px_65px_rgba(56,86,105,.18)]">

        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block lg:w-[210px] lg:shrink-0">
          <Sidebar />
        </div>

        {/* ── Mobile drawer ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-card">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="heading-section whitespace-nowrap">Smart Temp Monitor</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-5">
            <Outlet />
          </main>
        </div>

        {/* ── Right rail (desktop) ── */}
        <div className="hidden w-[220px] shrink-0 xl:block">
          <RightRail />
        </div>
      </div>
    </div>
  );
}