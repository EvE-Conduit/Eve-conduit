/**
 * @evecsm/sdk — everything a module's front end may use from the host.
 *
 * Module bundles import from "@evecsm/sdk", "react", "react-router" and
 * "@tanstack/react-query"; the host supplies all of them at runtime, so modules
 * share one React and look native.
 *
 * Styling: use the theme tokens (bg-surface, text-muted, border-border, bg-accent, text-accent-ink,
 * bg-success-soft text-success-fg, bg-hover, shadow-e2, p-card ...) rather than fixed colours, so
 * pages work in the dark, light and high-contrast themes. See theme.css for the full list.
 */
export { api, ApiError, request } from "@/lib/api";
export { defineModule } from "@/lib/modules";
export type { CharacterTab, DashboardWidget, ModuleFrontend, ModuleRoute } from "@/lib/modules";
export { useBootstrap, useCurrentUser, useHasPerm } from "@/lib/bootstrap";
export type * from "@/lib/types";
export { cn, timeAgo } from "@/lib/utils";
/** Number/ISK/date helpers; `localDateTime` and `clock` honour the user's time zone preference. */
export { clock, date, dateTime, duration, eveAndLocal, humanize, isk, localDateTime, num, sp } from "@/lib/format";

export { Avatar } from "@/components/ui/avatar";
/** Badge takes `tone` (neutral/accent/success/warning/danger/info) or any CSS `color`. */
export { Badge, CountBadge } from "@/components/ui/badge";
export { Button, buttonVariants } from "@/components/ui/button";
/** `<Card interactive>` lifts on hover; CardFooter holds actions. */
export { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
/** Dialog takes `size` (sm/md/lg/xl). ConfirmDialog: `onConfirm` may return a promise. */
export { ConfirmDialog, Dialog } from "@/components/ui/dialog";
export { DropdownCheckItem, DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
/** Form controls. Select takes `options` or <option> children. */
export { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/input";
/** Page scaffolding. KpiTile shows a value with a coloured +/- delta. */
export { DescriptionList, EmptyState, KpiTile, PageHeader, SectionTitle, StatCard } from "@/components/ui/page";
export { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
export { Switch, SwitchRow } from "@/components/ui/switch";
export { Tooltip } from "@/components/ui/tooltip";
/** Tabs (underline/pills, Radix-based) with TabPanel, and a Segmented control for view modes. */
export { Segmented, TabPanel, Tabs } from "@/components/ui/tabs";
/** Alert/Callout (info/success/warning/danger/accent), Progress, Meter, Spinner, Kbd, Separator, StatusDot. */
export { Alert, Callout, Kbd, Meter, Progress, Separator, Spinner, StatusDot } from "@/components/ui/feedback";
export { Popover, PopoverClose } from "@/components/ui/popover";
/** Styled table parts (Table/THead/Th/Tr/Td) and the higher-level DataTable/PagedTable. */
export { Table, TableToolbar, Td, Th, THead, Tr } from "@/components/ui/table";
export { DataTable, PagedTable } from "@/components/DataTable";
export type { Column } from "@/components/DataTable";
export { AreaChart } from "@/components/AreaChart";
export { BarChart } from "@/components/BarChart";
export { toast } from "sonner";
