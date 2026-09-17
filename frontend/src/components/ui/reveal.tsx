import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  ...rest
}: RevealProps & Record<string, unknown>) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          io.disconnect();
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={cn("reveal", className)} {...rest}>
      {children}
    </Component>
  );
}