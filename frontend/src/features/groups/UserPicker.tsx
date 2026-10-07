import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

import type { UserBrief } from "./types";

/** Pick users by any of their characters' names (admin only). */
export function UserPicker({ value, onChange }: { value: UserBrief[]; onChange: (v: UserBrief[]) => void }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user-lookup", dq],
    queryFn: () => api.get<UserBrief[]>(`/api/admin/users/lookup?q=${encodeURIComponent(dq)}`),
    enabled: dq.length >= 2,
  });
  const chosen = new Set(value.map((u) => u.id));
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((u) => (
            <span key={u.id} className="inline-flex items-center gap-1.5 rounded-none bg-surface-3 py-0.5 pl-0.5 pr-1 text-xs ring-1 ring-border">
              <Avatar src={u.portrait} name={u.name} size="xs" rounded="full" />
              {u.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== u.id))}
                className="rounded-none p-0.5 text-subtle hover:bg-hover-strong hover:text-text"
                aria-label={`Remove ${u.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member by character name" className="pl-9" />
        {dq.length >= 2 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-1 shadow-e3">
            {isLoading ? (
              <Spinner className="px-2 py-1.5" />
            ) : !data?.length ? (
              <div className="px-2 py-1.5 text-xs text-subtle">No member has a character by that name.</div>
            ) : (
              data.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={chosen.has(u.id)}
                  onClick={() => {
                    onChange([...value, u]);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-hover disabled:opacity-50"
                >
                  <Avatar src={u.portrait} name={u.name} size="xs" />
                  <span className="flex-1 truncate">{u.name}</span>
                  {chosen.has(u.id) && <span className="text-xs text-subtle">added</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
