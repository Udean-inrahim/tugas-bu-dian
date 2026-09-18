import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_KEY = "stm:theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* abaikan */
    }
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={theme === "dark" ? "Tema terang" : "Tema gelap"}
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className={cn(
        "grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-[#edf0ff] text-brand-blue transition hover:brightness-95 dark:bg-white/10 dark:text-indigo-200",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}