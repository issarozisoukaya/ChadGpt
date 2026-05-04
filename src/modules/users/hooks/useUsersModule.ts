"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/client";
import { useUsersStore } from "../store/usersStore";
import { toast } from "sonner";

export function useUsersModuleList() {
  const filters = useUsersStore((s) => s.filters);
  const pageSize = useUsersStore((s) => s.pageSize);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: filters.search.trim() || undefined,
      plan: filters.plan !== "all" ? filters.plan : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      country_code: filters.country_code || undefined,
      tags: filters.tags || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      sort: filters.sort,
      order: filters.order,
    }),
    [page, pageSize, filters]
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const q = useQuery({
    queryKey: ["users", "module", params],
    queryFn: () => adminApi.users.list(params),
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  return { ...q, page, setPage, params };
}

export function useUserDetail360(id: string | null) {
  return useQuery({
    queryKey: ["user", "360", id],
    queryFn: () => adminApi.users.get(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ["user", "activity", userId],
    queryFn: () => adminApi.users.activity(userId!, { limit: 50 }),
    enabled: !!userId,
  });
}

export function useUserMedia(userId: string | null) {
  return useQuery({
    queryKey: ["user", "media", userId],
    queryFn: () => adminApi.users.media(userId!, { limit: 48 }),
    enabled: !!userId,
  });
}

export function useUserTagMutations(userId: string | null) {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (tag: string) => adminApi.users.addTag(userId!, tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", userId] });
      qc.invalidateQueries({ queryKey: ["user", "360", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Tag ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (tag: string) => adminApi.users.removeTag(userId!, tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", userId] });
      qc.invalidateQueries({ queryKey: ["user", "360", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Tag retiré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return { add, remove };
}

export function useUserNoteMutation(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => adminApi.users.createNote(userId!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", "360", userId] });
      toast.success("Note enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
