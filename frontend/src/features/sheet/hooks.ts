import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";

import type { CharacterHeader } from "./types";

export function useCharacterHeader(id: number) {
  return useQuery({ queryKey: ["character", id], queryFn: () => api.get<CharacterHeader>(`/api/characters/${id}`), enabled: Number.isFinite(id) });
}

/** Data of one section, fetched only when the section has something to show. */
export function useSection<T>(id: number, path: string, enabled = true) {
  return useQuery({ queryKey: ["character", id, path], queryFn: () => api.get<T>(`/api/characters/${id}/${path}`), enabled });
}

export function useRefreshCharacter(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/characters/${id}/refresh`),
    onSuccess: () => {
      toast.success("Refresh queued. New data arrives within a minute or two.");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["character", id] }), 20_000);
    },
    onError: (e) => toast.error(e.message),
  });
}
