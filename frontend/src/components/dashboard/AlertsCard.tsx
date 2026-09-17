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
import { cn } from "@/lib/utils";

interface Props {
  summary: AlertSummary;
}

export function AlertsCard({ summary }: Props) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="micro-label flex items-center gap-2 text-black-light">
          <Bell className="h-4 w-4 text-primary" />
          Active Alerts
        </CardTitle>
        <Badge
          className={cn(summary.active > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}
        >
          {summary.active} Active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border p-3 text-center">
            <p className="text-2xl font-semibold text-red-600 tabular-nums">{summary.critical}</p>
            <p className="micro-label text-black-light">Critical</p>
          </div>
          <div className="border border-border p-3 text-center">
            <p className="text-2xl font-semibold text-yellow-600 tabular-nums">{summary.warning}</p>
            <p className="micro-label text-black-light">Warning</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate("/alerts")}
        >
          Lihat semua alert
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}