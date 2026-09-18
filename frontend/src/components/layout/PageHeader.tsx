import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <p className="micro-label mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-primary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow ?? "Sistem Monitoring"}
        </p>
        <h2 className="heading-page">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}