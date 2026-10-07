import { ChevronDown, Search } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const inputBase =
  "w-full rounded-none border border-border-strong bg-bg px-3 text-sm text-text placeholder:text-subtle transition-[border-color,box-shadow] hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, "h-9", className)} {...props} />;
}

/** An input with a magnifier icon; use for filter boxes above tables. */
export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <input type="search" className={cn(inputBase, "h-9 pl-9")} {...props} />
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-20 py-2 leading-relaxed", className)} {...props} />;
}

/** A styled native select (keyboard and screen-reader friendly everywhere). */
export function Select({
  className,
  options,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options?: { value: string; label: ReactNode; disabled?: boolean }[] }) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(inputBase, "h-9 cursor-pointer appearance-none pr-9")} {...props}>
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label as string}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[13px] font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger-fg">*</span>}
      </span>
      {children}
      {error ? <span className="block text-xs text-danger-fg">{error}</span> : hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}
