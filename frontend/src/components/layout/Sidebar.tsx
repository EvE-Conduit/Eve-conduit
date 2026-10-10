import { ChevronRight, ExternalLink, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { matchPath, NavLink, useLocation } from "react-router";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useBootstrap } from "@/lib/bootstrap";
import { cn } from "@/lib/utils";

import { Brand, BrandMark } from "./Brand";
import type { NavLinkItem, NavSection } from "./nav";

export type Side = "left" | "right";

/** Whether a rail is folded to icons, remembered per browser under `key`. */
export function useCollapsed(key: string) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(key, c ? "0" : "1");
      } catch {
        // storage unavailable; the choice lasts until reload
      }
      return !c;
    });
  return [collapsed, toggle] as const;
}

const FOLDED_KEY = "conduit:sidebar-folded";

function readFolded(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Which collapsible sections are folded away. */
function useFolded() {
  const [folded, setFolded] = useState<string[]>(readFolded);
  const toggle = (title: string) =>
    setFolded((f) => {
      const next = f.includes(title) ? f.filter((t) => t !== title) : [...f, title];
      try {
        localStorage.setItem(FOLDED_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable; the choice lasts until reload
      }
      return next;
    });
  return [folded, toggle] as const;
}

/** One sidebar link. `dimmed`: a page nested under it is the one you're on, so it doesn't show as current too. */
function NavEntry({
  item,
  collapsed,
  onNavigate,
  nested = false,
  dimmed = false,
  side = "left",
}: {
  item: NavLinkItem;
  collapsed: boolean;
  onNavigate?: () => void;
  nested?: boolean;
  dimmed?: boolean;
  side?: Side;
}) {
  const className = (isActive: boolean) =>
    cn(
      "group relative flex items-center font-medium tracking-[0.06em] transition-colors",
      nested ? "text-[13px]" : "text-sm",
      collapsed ? (nested ? "mx-auto size-8 justify-center" : "size-10 justify-center") : nested ? "gap-2.5 px-2.5 py-1.5" : "gap-3 px-3 py-2",
      isActive && !dimmed ? "bg-hover-strong text-text" : isActive ? "text-text hover:bg-hover" : "text-muted hover:bg-hover hover:text-text",
    );
  const link = item.external ? (
    // Another website, set up by an admin: opens in a new tab so the site stays open here.
    <a
      href={item.to}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      aria-label={collapsed ? `${item.label} (opens in a new tab)` : undefined}
      className={className(false)}
    >
      <item.icon className={cn("shrink-0 text-subtle transition-colors group-hover:text-muted", nested ? "size-4" : "size-[18px]")} />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <ExternalLink className="size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-label="opens in a new tab" />
        </>
      )}
    </a>
  ) : (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) => className(isActive)}
    >
      {({ isActive }) => {
        const current = isActive && !dimmed;
        return (
          <>
            {current && <span className={cn("absolute inset-y-0 w-[2px] bg-accent", side === "right" ? "right-0" : "left-0")} />}
            <item.icon
              className={cn(
                "shrink-0 transition-colors",
                nested ? "size-4" : "size-[18px]",
                current ? "text-accent-ink" : isActive ? "text-muted" : "text-subtle group-hover:text-muted",
              )}
            />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {!!item.badge &&
              (collapsed ? (
                <span className="absolute right-1.5 top-1.5 size-2 rotate-45 bg-warning" />
              ) : (
                <span className="font-mono text-[12px] font-semibold text-warning-fg tabular-nums">{item.badge > 99 ? "99+" : item.badge}</span>
              ))}
          </>
        );
      }}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip content={item.badge ? `${item.label} (${item.badge})` : item.external ? `${item.label} ↗` : item.label} side={side === "right" ? "left" : "right"}>
      {link}
    </Tooltip>
  ) : (
    link
  );
}

/**
 * Site navigation. `collapsed` turns it into an icon rail with tooltips (desktop only; the mobile
 * drawer always shows the full version). `side="right"` is the rail on the other side of the page:
 * its first section's title sits in the header in place of the brand, and there is no account card.
 */
export function Sidebar({
  sections,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
  side = "left",
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  side?: Side;
}) {
  const { user, site } = useBootstrap();
  const { pathname } = useLocation();
  const [folded, toggleFolded] = useFolded();
  const right = side === "right";
  const headline = right ? sections[0]?.title : undefined;
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-5")}>
        {right ? (
          collapsed ? (
            <Tooltip content={headline} side="left">
              <span role="img" aria-label={headline} className="flex">
                <ShieldCheck className="size-5 text-subtle" aria-hidden />
              </span>
            </Tooltip>
          ) : (
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle">{headline}</div>
          )
        ) : collapsed ? (
          <BrandMark />
        ) : (
          <Brand />
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-2", collapsed ? "space-y-4 px-2" : "space-y-6 px-3")} aria-label={headline ?? "Main"}>
        {sections.map((section) => {
          // The header above names the right rail's first section, so it has no title line to fold with.
          const titled = section.title !== headline;
          // The icon rail always shows everything: it has no titles to unfold with.
          const isFolded = !collapsed && titled && !!section.collapsible && folded.includes(section.title);
          // A folded section still shows the page you're on, so you never lose your place.
          const items = isFolded ? section.items.filter((i) => !i.external && matchPath({ path: i.to, end: !!i.end }, pathname)) : section.items;
          const hiddenBadges = isFolded ? section.items.filter((i) => !items.includes(i)).reduce((n, i) => n + (i.badge ?? 0), 0) : 0;
          const listId = `nav-${section.title.toLowerCase().replace(/\W+/g, "-")}`;
          return (
            <div key={section.title}>
              {!titled ? null : collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-border first:hidden" aria-hidden />
              ) : section.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleFolded(section.title)}
                  aria-expanded={!isFolded}
                  aria-controls={listId}
                  className="group mb-2 flex w-full items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle transition-colors hover:text-muted"
                >
                  <span className="flex-1 text-left">{section.title}</span>
                  {hiddenBadges > 0 && <span className="size-1.5 rotate-45 bg-warning" aria-label={`${hiddenBadges} waiting`} />}
                  <ChevronRight className={cn("size-3.5 transition-transform duration-150", !isFolded && "rotate-90")} aria-hidden />
                </button>
              ) : (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle">{section.title}</div>
              )}
              <ul id={listId} className="space-y-0.5">
                {items.map((item) => {
                  const inside = !item.external && !!matchPath({ path: `${item.to}/*`, end: false }, pathname);
                  // Nested pages show while you're in that part of the site; the icon rail shows them as icons.
                  const children = inside ? (item.children ?? []) : [];
                  const childActive = children.some((c) => matchPath({ path: c.to, end: false }, pathname));
                  return (
                    <li key={item.to}>
                      <NavEntry item={item} collapsed={collapsed} onNavigate={onNavigate} dimmed={childActive} side={side} />
                      {children.length > 0 && (
                        <ul className={cn("mt-0.5 space-y-0.5", !collapsed && "ml-5 border-l border-border pl-2")}>
                          {children.map((child) => (
                            <li key={child.to}>
                              <NavEntry item={child} collapsed={collapsed} onNavigate={onNavigate} nested side={side} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {right && onToggleCollapsed && (
        <div className={cn("shrink-0 border-t border-border", collapsed ? "p-2" : "p-3")}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-subtle transition-colors hover:bg-hover hover:text-text",
              collapsed ? "mx-auto size-8 justify-center" : "w-full px-2 py-1.5",
            )}
            aria-label={collapsed ? `Expand ${headline ?? "rail"}` : `Collapse ${headline ?? "rail"}`}
          >
            {collapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            {!collapsed && <span className="flex-1 text-left">Collapse</span>}
          </button>
        </div>
      )}

      {!right && user && (
        <div className={cn("shrink-0 border-t border-border", collapsed ? "p-2" : "p-3")}>
          {collapsed ? (
            <Tooltip content={user.name} side="right">
              <NavLink to="/characters" onClick={onNavigate} className="mx-auto grid size-10 place-items-center hover:bg-hover">
                <Avatar src={user.main?.portrait} name={user.name} size="sm" />
              </NavLink>
            </Tooltip>
          ) : (
            <NavLink to="/characters" onClick={onNavigate} className="flex items-center gap-3 p-2 transition-colors hover:bg-hover">
              <Avatar src={user.main?.portrait} name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text">{user.name}</div>
                <div className="truncate text-xs text-muted">{user.main?.corporation?.name ?? "No corporation"}</div>
              </div>
              {user.is_admin ? (
                <Badge tone="accent" variant="dot" size="xs">
                  {user.is_owner ? "Super admin" : "Admin"}
                </Badge>
              ) : (
                user.state && (
                  <Badge color={user.state.color} variant="dot" size="xs">
                    {user.state.name}
                  </Badge>
                )
              )}
            </NavLink>
          )}
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              className={cn(
                "mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-subtle transition-colors hover:bg-hover hover:text-text",
                collapsed ? "mx-auto size-8 justify-center" : "w-full px-2 py-1.5",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Collapse</span>
                  <span className="tabular-nums">v{site.version}</span>
                </>
              )}
            </button>
          )}
          {!onToggleCollapsed && !collapsed && <div className="mt-2 px-2 text-[11px] text-subtle">EvE Conduit v{site.version}</div>}
        </div>
      )}
    </div>
  );
}
