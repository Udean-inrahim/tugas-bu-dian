import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlertSummary } from "@/types";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  summary: AlertSummary;
}

export function AlertsCard({ summary }: Props) {
  const navigate = useNavigate();
  const critical = useCountUp(summary.critical);
  const warning = useCountUp(summary.warning);
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="micro-label flex min-w-0 items-center gap-2 text-black-light">
          <Bell className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">Active Alerts</span>
        </CardTitle>
        <Badge
          className={cn(summary.active > 0 ? "shrink-0 bg-red-100 text-red-700" : "shrink-0 bg-green-100 text-green-700")}
        >
          {summary.active} Active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border p-3 text-center">
            <p className="text-2xl font-semibold text-red-600 tabular-nums">{critical.toFixed(0)}</p>
            <p className="micro-label text-black-light">Critical</p>
          </div>
          <div className="border border-border p-3 text-center">
            <p className="text-2xl font-semibold text-yellow-600 tabular-nums">{warning.toFixed(0)}</p>
            <p className="micro-label text-black-light">Warning</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="link-arrow w-full"
          onClick={() => navigate("/alerts")}
        >
          Lihat semua alert
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}