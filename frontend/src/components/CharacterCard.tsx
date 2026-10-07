import { AlertTriangle, Crown, KeyRound, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import type { MyCharacter } from "@/lib/types";
import { cn } from "@/lib/utils";

export function tokenProblem(c: MyCharacter): string | null {
  if (!c.token || !c.token.valid) return "Login expired. Re-authorise this character.";
  if (c.token.missing_scopes.length) return `Missing ${c.token.missing_scopes.length} permission${c.token.missing_scopes.length === 1 ? "" : "s"} that enabled plugins need.`;
  return null;
}

export function CharacterCard({
  character: c,
  onMakeMain,
  onRemove,
}: {
  character: MyCharacter;
  onMakeMain?: () => void;
  onRemove?: () => void;
}) {
  const problem = tokenProblem(c);
  return (
    <div className={cn("panel group relative overflow-hidden rounded-xl transition-all hover:-translate-y-0.5 hover:border-border-strong", c.is_main && "border-accent/30")}>
      {c.is_main && <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-accent" />}
      <Link to={`/characters/${c.id}`} className="flex items-center gap-4 p-4">
        <div className="relative">
          <Avatar src={c.portrait} name={c.name} size="lg" />
          {c.is_main && (
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-none bg-accent text-accent-fg ring-2 ring-surface">
              <Crown className="size-3" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{c.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            {c.corporation ? (
              <>
                <img src={c.corporation.logo} alt="" className="size-4 rounded-sm" />
                <span className="truncate">{c.corporation.name}</span>
              </>
            ) : (
              <span className="text-subtle">Corporation pending…</span>
            )}
          </div>
          {c.alliance && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
              <img src={c.alliance.logo} alt="" className="size-4 rounded-sm" />
              <span className="truncate">{c.alliance.name}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        {problem ? (
          <Tooltip content={problem}>
            <a href={`/sso/add-character?next=/characters`} className="flex items-center gap-1.5 text-xs text-warning-fg hover:underline">
              <AlertTriangle className="size-3.5" /> Needs attention
            </a>
          </Tooltip>
        ) : (
          <Badge color="var(--success)" variant="dot">
            Token OK
          </Badge>
        )}
        {(onMakeMain || onRemove) && (
          <DropdownMenu>
            <DropdownTrigger className="rounded-md p-1 text-subtle outline-none hover:bg-hover-strong hover:text-text" aria-label={`Actions for ${c.name}`}>
              <MoreHorizontal className="size-4" />
            </DropdownTrigger>
            <DropdownContent>
              {!c.is_main && onMakeMain && (
                <DropdownItem onSelect={onMakeMain}>
                  <Star /> Make main character
                </DropdownItem>
              )}
              <DropdownItem onSelect={() => (window.location.href = "/sso/add-character?next=/characters")}>
                <KeyRound /> Re-authorise
              </DropdownItem>
              {!c.is_main && onRemove && (
                <>
                  <DropdownSeparator />
                  <DropdownItem danger onSelect={onRemove}>
                    <Trash2 /> Remove
                  </DropdownItem>
                </>
              )}
            </DropdownContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
