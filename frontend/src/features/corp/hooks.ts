import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";

import type { CorpHeader } from "./types";

export const corpBase = (id: number) => `/api/corporations/${id}`;

export function useCorpHeader(id: number) {
  return useQuery({ queryKey: ["corporation", id], queryFn: () => api.get<CorpHeader>(corpBase(id)), enabled: Number.isFinite(id) });
}

export function useCorpSection<T>(id: number, path: string, enabled = true) {
  return useQuery({ queryKey: ["corporation", id, path], queryFn: () => api.get<T>(`${corpBase(id)}/${path}`), enabled });
}

export function useRefreshCorporation(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`${corpBase(id)}/refresh`),
    onSuccess: () => {
      toast.success("Refresh queued. New data arrives within a few minutes.");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["corporation", id] }), 30_000);
    },
    onError: (e) => toast.error(e.message),
  });
}
