import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { Bell, CornerDownLeft, Loader2, Moon, Search, SlidersHorizontal, Sun, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { isSitePath } from "@/lib/externalLinks";

import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { iconFor } from "@/lib/icons";
import type { MyCharacter, SearchGroup, SearchHit } from "@/lib/types";

import type { NavSection } from "./nav";
import { useToggleTheme } from "./ThemeToggle";

const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-subtle";
const itemClass =
  "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted data-[selected=true]:bg-hover-strong data-[selected=true]:text-text [&_svg]:size-4";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CommandPalette({
  open,
  onOpenChange,
  sections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: NavSection[];
}) {
  const navigate = useNavigate();
  const theme = useToggleTheme();
  const [query, setQuery] = useState("");
  const q = useDebounced(query.trim(), 150);
  const { data: characters = [] } = useQuery({
    queryKey: ["me", "characters"],
    queryFn: () => api.get<MyCharacter[]>("/api/me/characters"),
    enabled: open,
  });
  const remote = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get<{ groups: SearchGroup[] }>(`/api/search?q=${encodeURIComponent(q)}&limit=8`),
    enabled: open && q.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
  // Until the search endpoint exists (or if it errors) the palette quietly shows local results only.
  const groups = (remote.data?.groups ?? []).filter((g) => g.hits.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    if (/^https:\/\//.test(to)) window.open(to, "_blank", "noopener,noreferrer");
    else if (!isSitePath(to)) return; // only https:// or paths on this site
    else if (to.startsWith("/sso/") || to.startsWith("/django-admin")) window.location.href = to;
    else navigate(to);
  };
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[3px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border-strong bg-surface-raised shadow-e3 animate-scale-in">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Find pages, characters, corporations, items and more</DialogPrimitive.Description>
          <Command loop shouldFilter={true}>
            <div className="flex items-center gap-3 border-b border-border px-4">
              {remote.isFetching ? <Loader2 className="size-[18px] animate-spin text-muted" /> : <Search className="size-[18px] text-muted" />}
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, characters, corporations, items…"
                className="h-14 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-subtle"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
              <Command.Empty className="py-12 text-center text-sm text-muted">
                {remote.isFetching ? "Searching…" : q.length >= 2 ? `Nothing matches "${q}".` : "Nothing matches that."}
              </Command.Empty>

              {groups.map((g) => (
                <Command.Group key={g.key} heading={g.label} className={groupClass}>
                  {g.hits.map((h) => (
                    <RemoteItem key={`${g.key}:${h.id}`} hit={h} query={q} onSelect={() => go(h.url)} />
                  ))}
                </Command.Group>
              ))}

              {sections.map((section) => (
                <Command.Group key={section.title} heading={section.title} className={groupClass}>
                  {section.items.map((item) => (
                    <Command.Item key={item.to} value={`page ${section.title} ${item.label}`} onSelect={() => go(item.to)} className={itemClass}>
                      <span className="grid size-7 place-items-center rounded-md bg-hover-strong text-muted group-data-[selected=true]:text-accent-ink">
                        <item.icon />
                      </span>
                      <span className="text-text">{item.label}</span>
                      <CornerDownLeft className="ml-auto opacity-0 group-data-[selected=true]:opacity-60" />
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
              {characters.length > 0 && (
                <Command.Group heading="Your characters" className={groupClass}>
                  {characters.map((c) => (
                    <Command.Item key={c.id} value={`character ${c.name} ${c.corporation?.name ?? ""}`} onSelect={() => go(`/characters/${c.id}`)} className={itemClass}>
                      <Avatar src={c.portrait} name={c.name} size="xs" />
                      <span className="text-text">{c.name}</span>
                      <span className="truncate text-xs text-muted">{c.corporation?.name}</span>
                      <CornerDownLeft className="ml-auto opacity-0 group-data-[selected=true]:opacity-60" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              <Command.Group heading="Actions" className={groupClass}>
                <Command.Item value="action toggle theme dark light mode" onSelect={() => run(theme.toggle)} className={itemClass}>
                  {theme.isDark ? <Sun /> : <Moon />}
                  Switch to {theme.isDark ? "light" : "dark"} theme
                </Command.Item>
                <Command.Item value="action notifications inbox alerts" onSelect={() => go("/notifications")} className={itemClass}>
                  <Bell /> Notifications
                </Command.Item>
                <Command.Item value="action settings preferences time zone appearance" onSelect={() => go("/settings")} className={itemClass}>
                  <SlidersHorizontal /> Settings
                </Command.Item>
                <Command.Item value="action add character link alt" onSelect={() => go("/sso/add-character?next=/characters")} className={itemClass}>
                  <UserPlus /> Add a character
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="flex items-center gap-4 border-t border-border bg-surface-2/60 px-4 py-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> to move
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> to open
              </span>
              <span className="ml-auto hidden sm:block">
                Tip: press <Kbd>/</Kbd> anywhere to search
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function RemoteItem({ hit, query, onSelect }: { hit: SearchHit; query: string; onSelect: () => void }) {
  const Icon = iconFor(hit.icon);
  return (
    // Include the query in the value so cmdk's own filter never hides server results.
    <Command.Item value={`remote ${hit.id} ${hit.title} ${query}`} onSelect={onSelect} className={itemClass}>
      {hit.image ? (
        <img src={hit.image} alt="" className="size-7 shrink-0 rounded-md bg-surface-3 object-cover ring-1 ring-border" loading="lazy" />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-hover-strong text-muted">
          <Icon />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-text">{hit.title}</span>
        {hit.subtitle && <span className="block truncate text-xs text-muted">{hit.subtitle}</span>}
      </span>
      <CornerDownLeft className="ml-auto shrink-0 opacity-0 group-data-[selected=true]:opacity-60" />
    </Command.Item>
  );
}
