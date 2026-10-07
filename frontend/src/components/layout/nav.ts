import { Building2, Crown, HeartPulse, ShieldAlert, Webhook } from "lucide-react";
import { KeyRound, LayoutDashboard, Package, Puzzle, ScrollText, Settings2, ShieldCheck, Users, UsersRound, Wallet, type LucideIcon } from "lucide-react";

import { iconFor } from "@/lib/icons";
import type { CurrentUser, ModuleEntry } from "@/lib/types";

export interface NavLinkItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Count shown next to the label (e.g. pending requests); hidden when 0. */
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavLinkItem[];
}

function can(user: CurrentUser, perm: string) {
  return user.is_admin || user.permissions.includes(perm);
}

export function buildNav(user: CurrentUser, modules: ModuleEntry[]): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
        { label: "Characters", to: "/characters", icon: UsersRound },
        { label: "Wallet", to: "/wallet", icon: Wallet },
        { label: "Assets", to: "/assets", icon: Package },
        { label: "Groups", to: "/groups", icon: Users },
      ],
    },
  ];
  if (user.leads_groups) {
    sections[0]!.items.push({ label: "Manage groups", to: "/groups/manage", icon: Crown, badge: user.pending_group_requests ?? 0 });
  }
  if (["corp.view_own_corporation", "corp.view_alliance_corporations", "corp.view_all_corporations"].some((p) => can(user, p))) {
    sections[0]!.items.splice(2, 0, { label: "Corporations", to: "/corporations", icon: Building2 });
  }

  const moduleItems = modules.flatMap((m) =>
    m.nav.map((n) => ({ label: n.label, to: `/m/${m.id}${n.path ? `/${n.path.replace(/^\//, "")}` : ""}`, icon: iconFor(n.icon) })),
  );
  if (moduleItems.length) sections.push({ title: "Modules", items: moduleItems });

  const admin: NavLinkItem[] = [];
  if (can(user, "site.view_members")) admin.push({ label: "Members", to: "/admin/members", icon: Users });
  if (can(user, "site.manage_access")) admin.push({ label: "Access", to: "/admin/access", icon: ShieldCheck });
  if (can(user, "access.view_compliance")) admin.push({ label: "Compliance", to: "/admin/compliance", icon: ShieldAlert });
  if (can(user, "site.manage_modules")) admin.push({ label: "Modules", to: "/admin/modules", icon: Puzzle });
  if (can(user, "site.manage_api")) admin.push({ label: "API", to: "/admin/api", icon: KeyRound });
  if (can(user, "site.manage_api")) admin.push({ label: "Integrations", to: "/admin/integrations", icon: Webhook });
  if (can(user, "site.view_logs")) admin.push({ label: "Logs", to: "/admin/logs", icon: ScrollText });
  if (can(user, "site.view_health")) admin.push({ label: "Health", to: "/admin/health", icon: HeartPulse });
  if (can(user, "site.manage_site")) admin.push({ label: "Settings", to: "/admin/settings", icon: Settings2 });
  if (admin.length) sections.push({ title: "Administration", items: admin });

  return sections;
}
