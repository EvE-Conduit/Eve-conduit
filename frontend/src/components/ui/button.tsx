import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-none text-[13px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-accent bg-accent text-accent-fg hover:brightness-110",
        secondary: "border border-border-strong bg-transparent text-text hover:border-accent hover:bg-hover",
        outline: "border border-accent text-accent-ink hover:bg-hover",
        ghost: "text-muted hover:bg-hover-strong hover:text-text",
        subtle: "bg-hover text-text hover:bg-hover-strong",
        danger: "border border-danger/35 bg-danger-soft text-danger-fg hover:bg-danger/20",
        solidDanger: "border border-danger bg-danger text-white hover:brightness-110",
        success: "border border-success/35 bg-success-soft text-success-fg hover:bg-success/20",
        link: "h-auto px-0 normal-case tracking-normal font-medium text-accent-ink underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-[11px] [&_svg]:size-3.5",
        sm: "h-8 px-3 text-[12px]",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-[14px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  );
}

export { buttonVariants };
