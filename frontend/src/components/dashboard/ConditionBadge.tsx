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
    green: "bg-[#37bc99]",
    yellow: "bg-[#e4bd4e]",
    red: "bg-[#ff6570]",
    blue: "bg-[#6fb6f5]",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[color])} />;
}