import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownTrigger = Menu.Trigger;

export function DropdownContent({
  children,
  align = "end",
  side = "bottom",
  className,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        side={side}
        sideOffset={8}
        collisionPadding={8}
        className={cn("z-50 min-w-52 rounded-xl border border-border-strong bg-surface-raised p-1.5 shadow-e3 animate-scale-in", className)}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

export function DropdownItem({ className, danger, ...props }: Menu.DropdownMenuItemProps & { danger?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-hover-strong data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted",
        danger && "text-danger-fg data-[highlighted]:bg-danger-soft [&_svg]:text-danger-fg",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownCheckItem({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Menu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
      className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-hover-strong"
    >
      <span className="grid size-4 place-items-center rounded border border-border-strong data-[state=checked]:border-accent data-[state=checked]:bg-accent">
        <Menu.ItemIndicator>
          <Check className="size-3 text-accent-fg" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.CheckboxItem>
  );
}

export function DropdownSeparator() {
  return <Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">{children}</Menu.Label>;
}
