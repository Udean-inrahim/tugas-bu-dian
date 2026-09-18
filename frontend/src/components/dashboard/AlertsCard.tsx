import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AlertSummary } from "@/types";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  summary: AlertSummary;
}

export function AlertsCard({ summary }: Props) {
  const navigate = useNavigate();
  const active = useCountUp(summary.active);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "chip-icon",
            summary.active > 0 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          )}
        >
          <Bell className="h-6 w-6" />
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            summary.active > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          )}
        >
          {summary.active > 0 ? `${summary.active} aktif` : "Aman"}
        </span>
      </div>
      <p className="mt-4 text-[13px] font-semibold text-muted-foreground">Alert Aktif</p>
      <p className="mt-1 whitespace-nowrap text-4xl font-extrabold tabular-nums tracking-tight">
        {active.toFixed(0)}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="link-arrow mt-3 h-8 w-full px-3"
        onClick={() => navigate("/alerts")}
      >
        Lihat semua alert
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}