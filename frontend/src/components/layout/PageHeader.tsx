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
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="micro-label mb-2 inline-flex items-center gap-2 rounded-full bg-[#edf1ff] px-3 py-1 text-brand-blue">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-blue" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
        {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}