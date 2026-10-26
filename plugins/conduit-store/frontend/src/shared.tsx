// Pieces used by the members' and the officers' pages.
import { api, Avatar, Badge, cn, Input, Spinner } from "@conduit/sdk";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { Coins, Package, X } from "./icons";
import { type OrderStatus, STATUS } from "./types";

export const points = (n: number) => n.toLocaleString("en");

export function Points({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", className)}>
      <Coins className="size-3.5 text-accent-ink" />
      {points(value)}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

export function ItemIcon({ icon, name, className = "size-10" }: { icon: string | null; name: string; className?: string }) {
  return icon ? (
    <img src={icon} alt="" title={name} className={cn("shrink-0 border border-border bg-surface-2", className)} loading="lazy" />
  ) : (
    <div className={cn("grid shrink-0 place-items-center border border-border-strong text-accent-ink", className)}>
      <Package className="size-1/2" />
    </div>
  );
}

interface Hit {
  id: number;
  name: string;
  subtitle?: string;
  icon?: string | null;
  portrait?: string | null;
}

/** Type part of a name and pick from what pops up (members, or EVE items). */
export function Picker<T extends Hit>({
  url, value, onChange, placeholder, empty, render,
}: {
  url: string;
  value: T | null;
  onChange: (v: T | null) => void;
  placeholder: string;
  empty: string;
  render?: (v: T) => ReactNode;
}) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["store", "pick", url, dq],
    queryFn: () => api.get<T[]>(`${url}?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const hits = data ?? [];
  const pick = (h: T) => {
    onChange(h);
    setQ("");
    setOpen(false);
  };
  const face = (h: T, size: "xs" | "sm") =>
    h.portrait !== undefined ? <Avatar src={h.portrait} name={h.name} size={size} /> : <ItemIcon icon={h.icon ?? null} name={h.name} className={size === "xs" ? "size-6" : "size-8"} />;

  if (value)
    return (
      <div className="inline-flex max-w-full items-center gap-2 border border-border bg-surface-2/60 py-1 pl-1 pr-1.5 text-sm">
        {face(value, "sm")}
        <span className="truncate font-medium">{render ? render(value) : value.name}</span>
        <button type="button" onClick={() => onChange(null)} className="p-0.5 text-subtle hover:text-text" aria-label={`Remove ${value.name}`}>
          <X className="size-3.5" />
        </button>
      </div>
    );
  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!hits.length) return;
          if (e.key === "ArrowDown") setActive((i) => (i + 1) % hits.length);
          else if (e.key === "ArrowUp") setActive((i) => (i - 1 + hits.length) % hits.length);
          else if (e.key === "Enter") pick(hits[Math.min(active, hits.length - 1)]!);
          else return;
          e.preventDefault();
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && dq.length >= 2}
      />
      {open && dq.length >= 2 && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3" role="listbox">
          {isLoading ? (
            <Spinner className="px-2 py-1.5" />
          ) : hits.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-subtle">{empty}</div>
          ) : (
            hits.map((h, i) => (
              <button
                key={h.id}
                type="button"
                role="option"
                aria-selected={i === active}
                // mousedown, not click: the input's blur would close the list first.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(h);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm", i === active && "bg-hover")}
              >
                {face(h, "xs")}
                <span className="flex-1 truncate">{h.name}</span>
                {h.subtitle && <span className="truncate text-xs text-subtle">{h.subtitle}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
