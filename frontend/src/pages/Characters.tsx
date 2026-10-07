import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { CharacterCard } from "@/components/CharacterCard";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { BOOTSTRAP_KEY } from "@/lib/bootstrap";
import { SSO_ERRORS } from "@/lib/messages";
import type { MyCharacter } from "@/lib/types";

export const myCharactersQuery = { queryKey: ["me", "characters"], queryFn: () => api.get<MyCharacter[]>("/api/me/characters") };

export function useSsoResultToasts() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const error = params.get("error");
    const added = params.get("added");
    if (!error && !added) return;
    if (error) toast.error(SSO_ERRORS[error] ?? "Something went wrong with EVE login.");
    if (added) toast.success("Character linked");
    setParams({}, { replace: true });
  }, [params, setParams]);
}

export function Characters() {
  useSsoResultToasts();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(myCharactersQuery);
  const [removing, setRemoving] = useState<MyCharacter | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["me", "characters"] });
    qc.invalidateQueries({ queryKey: BOOTSTRAP_KEY });
  };
  const makeMain = useMutation({
    mutationFn: (id: number) => api.post(`/api/me/characters/${id}/main`),
    onSuccess: () => {
      toast.success("Main character updated");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/api/me/characters/${id}`),
    onSuccess: () => {
      toast.success("Character removed");
      setRemoving(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Characters"
        icon={<UsersRound />}
        description="Every character you link shares this account. Your main decides your corporation, alliance and access."
        actions={
          <a href="/sso/add-character?next=/characters">
            <Button variant="primary">
              <UserPlus /> Add character
            </Button>
          </a>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c, i) => (
            <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <CharacterCard character={c} onMakeMain={() => makeMain.mutate(c.id)} onRemove={() => setRemoving(c)} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<UsersRound />} title="No characters yet" description="Link your first character to get started." />
      )}

      <Dialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description="The character is unlinked from your account and its stored login is deleted. You can add it back any time."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => removing && remove.mutate(removing.id)}>
              Remove character
            </Button>
          </>
        }
      />
    </>
  );
}
