import { useBootstrap } from "@/lib/bootstrap";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  const { site } = useBootstrap();
  if (site.logo_url) {
    return <img src={site.logo_url} alt="" className={cn("size-8 object-cover", className)} />;
  }
  return (
    <svg viewBox="0 0 34 34" className={cn("size-8", className)} aria-hidden>
      <path d="M17 2 31 10v14L17 32 3 24V10z" fill="none" stroke="var(--site-accent)" strokeWidth="1.6" />
      <path d="M17 10 24 14v6l-7 4-7-4v-6z" fill="var(--site-accent)" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  const { site } = useBootstrap();
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[16px] font-bold uppercase tracking-[0.14em]">{site.name}</div>
        {site.tagline && <div className="truncate text-[11px] uppercase tracking-[0.2em] text-subtle">{site.tagline}</div>}
      </div>
    </div>
  );
}
