import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-[3px] text-[12px] font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#3d41ad] text-white",
        secondary: "border-transparent bg-[#f1f3f9] text-[#545b6c]",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-[#e2e5ee] bg-white text-[#545b6c]",
        success: "border-transparent bg-[#37bc99] text-white",
        warning: "border-transparent bg-[#e4bd4e] text-[#3a3116]",
        info: "border-transparent bg-[#6fb6f5] text-[#12324d]",
        white: "border-white text-white bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };