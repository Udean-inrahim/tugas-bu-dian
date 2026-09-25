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
        "flex flex-col gap-3 border-b border-dashed border-[#e2e5ee] pb-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-2 rounded-[7px] bg-[#f1f3f9] px-2.5 py-1 text-[12px] font-semibold text-[#3d41ad]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3d41ad]" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-[#272a3b]">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-[13.5px] text-[#616879]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
