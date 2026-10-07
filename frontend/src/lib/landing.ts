import { api } from "./api";
import type { CurrentUser } from "./types";

/** The landing page at /home. Admins edit it under Administration > Settings > Landing page. */
export interface LandingContent {
  hero: { eyebrow: string; title: string; subtitle: string; image_url: string; show_profile: boolean };
  buttons: { label: string; link: string; style: "primary" | "secondary" }[];
  show_status: boolean;
  cards_title: string;
  cards: { icon: string; title: string; text: string; link: string }[];
  sections: { title: string; body: string }[];
}

export interface LandingResponse {
  content: LandingContent;
  is_default: boolean;
  default: LandingContent;
}

export const LANDING_KEY = ["landing"] as const;
export const landingQuery = { queryKey: LANDING_KEY, queryFn: () => api.get<LandingResponse>("/api/core/landing") };

export const PLACEHOLDERS = ["{name}", "{corporation}", "{alliance}", "{site}"] as const;

/** Fill in {name}, {corporation}, {alliance} and {site} for the person looking. */
export function fill(text: string, user: CurrentUser | null, siteName: string) {
  const values: Record<string, string> = {
    name: user?.main?.name ?? user?.name ?? "capsuleer",
    corporation: user?.main?.corporation?.name ?? "your corporation",
    alliance: user?.main?.alliance?.name ?? "your alliance",
    site: siteName,
  };
  return text.replace(/\{(name|corporation|alliance|site)\}/g, (_, k: string) => values[k]!);
}
