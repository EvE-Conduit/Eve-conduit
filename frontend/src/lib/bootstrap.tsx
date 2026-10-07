import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import { api } from "./api";
import type { Bootstrap } from "./types";

export const BOOTSTRAP_KEY = ["bootstrap"] as const;

export function fetchBootstrap() {
  return api.get<Bootstrap>("/api/core/bootstrap");
}

const BootstrapContext = createContext<Bootstrap | null>(null);

export function BootstrapProvider({ initial, children }: { initial: Bootstrap; children: ReactNode }) {
  const { data } = useQuery({
    queryKey: BOOTSTRAP_KEY,
    queryFn: fetchBootstrap,
    initialData: initial,
    staleTime: 60_000,
    // Notice an update starting (and finishing) without anyone reloading; quickly while one runs.
    refetchInterval: (q) => (q.state.data?.site.updating || q.state.data?.site.update_pending ? 4_000 : 120_000),
    retry: true,
    // While the site restarts, try again every few seconds so it's noticed as soon as it's back.
    retryDelay: 3_000,
  });
  return <BootstrapContext.Provider value={data}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): Bootstrap {
  const value = useContext(BootstrapContext);
  if (!value) throw new Error("useBootstrap must be used inside BootstrapProvider");
  return value;
}

export function useCurrentUser() {
  return useBootstrap().user;
}

/** True when the signed-in user holds the permission (admins hold everything). */
export function useHasPerm(perm: string | null | undefined) {
  const user = useCurrentUser();
  if (!perm) return true;
  return !!user && (user.is_admin || user.permissions.includes(perm));
}

export function useRefreshBootstrap() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
}

/** Apply per-install branding: accent colour (with readable text on top) and title. */
export function applyBranding(site: Pick<Bootstrap["site"], "accent" | "name">) {
  applyAccent(site.accent);
  document.title = site.name;
}

/**
 * Set the install's accent. theme.css derives --site-accent from --brand per theme (deeper in
 * light mode), so text on accent buttons is computed for both variants.
 */
export function applyAccent(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
  const root = document.documentElement;
  root.style.removeProperty("--site-accent");
  root.style.removeProperty("--accent-fg");
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--accent-fg-dark", readableOn(rgb(hex)));
  // Light theme mixes the brand 74% with near-black (#0b1220); approximate that in sRGB.
  const [r, g, b] = rgb(hex);
  root.style.setProperty("--accent-fg-light", readableOn([r * 0.74 + 11 * 0.26, g * 0.74 + 18 * 0.26, b * 0.74 + 32 * 0.26]));
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readableOn([r0, g0, b0]: [number, number, number]) {
  const [r, g, b] = [r0, g0, b0].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.3 ? "#05121a" : "#ffffff";
}
