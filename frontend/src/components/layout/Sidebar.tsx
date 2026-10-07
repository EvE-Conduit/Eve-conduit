import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useBootstrap } from "@/lib/bootstrap";
import { cn } from "@/lib/utils";

import { Brand, BrandMark } from "./Brand";
import type { NavSection } from "./nav";

const COLLAPSE_KEY = "conduit:sidebar-collapsed";

export function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeCollapsed(v: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  } catch {
    // storage unavailable; the choice lasts until reload
  }
}

/**
 * Site navigation. `collapsed` turns it into an icon rail with tooltips (desktop only; the mobile
 * drawer always shows the full version).
 */
export function Sidebar({
  sections,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const { user, site } = useBootstrap();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-5")}>
        {collapsed ? <BrandMark /> : <Brand />}
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-2", collapsed ? "space-y-4 px-2" : "space-y-6 px-3")} aria-label="Main">
        {sections.map((section) => (
          <div key={section.title}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border first:hidden" aria-hidden />
            ) : (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-subtle">{section.title}</div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    aria-label={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center text-sm font-medium tracking-[0.06em] transition-colors",
                        collapsed ? "size-10 justify-center" : "gap-3 px-3 py-2",
                        isActive ? "bg-hover-strong text-text" : "text-muted hover:bg-hover hover:text-text",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" />}
                        <item.icon className={cn("size-[18px] shrink-0 transition-colors", isActive ? "text-accent-ink" : "text-subtle group-hover:text-muted")} />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                        {!!item.badge &&
                          (collapsed ? (
                            <span className="absolute right-1.5 top-1.5 size-2 rotate-45 bg-warning" />
                          ) : (
                            <span className="font-mono text-[12px] font-semibold text-warning-fg tabular-nums">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          ))}
                      </>
                    )}
                  </NavLink>
                );
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip content={item.badge ? `${item.label} (${item.badge})` : item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
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
              {user.state && (
                <Badge color={user.state.color} variant="dot" size="xs">
                  {user.state.name}
                </Badge>
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
