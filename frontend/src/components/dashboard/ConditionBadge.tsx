import { Badge } from "@/components/ui/badge";
import type { Condition } from "@/types";
import { cn } from "@/lib/utils";
import { statusBg } from "@/lib/threshold";

export function ConditionBadge({ condition, className }: { condition: Condition; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(statusBg[condition.color], className)}>
      {condition.label}
    </Badge>
  );
}

export function StatusDot({ color }: { color: Condition["color"] }) {
  const colors: Record<string, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[color])} />;
}