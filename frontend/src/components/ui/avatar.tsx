import { useState } from "react";

import { cn, initials } from "@/lib/utils";

const SIZES = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base", xl: "size-24 text-2xl" };

export function Avatar({
  src,
  name,
  size = "md",
  className,
  rounded = "lg",
  status,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  rounded?: "lg" | "full";
  /** Small presence dot in the corner. */
  status?: "online" | "offline" | "warning";
}) {
  const [failed, setFailed] = useState(false);
  // HUD look: large faces are hexagons, small ones square.
  const shape = rounded === "full" ? "rounded-full" : size === "xl" || size === "lg" ? "hex" : "rounded-control";
  const face = (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden bg-surface-3 font-semibold text-muted ring-1 ring-border-strong",
        SIZES[size],
        shape,
        className,
      )}
    >
      {src && !failed ? (
        <img src={src} alt={name} loading="lazy" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
  if (!status) return face;
  return (
    <span className="relative inline-flex shrink-0">
      {face}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 size-2.5 rotate-45 ring-2 ring-surface",
          status === "online" ? "bg-success" : status === "warning" ? "bg-warning" : "bg-subtle",
        )}
      />
    </span>
  );
}
