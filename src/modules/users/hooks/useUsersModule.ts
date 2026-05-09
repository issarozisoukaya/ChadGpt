"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/client";
import { supabaseAdminUsers } from "@/lib/api/supabase-admin-users";
import { getUsersDataSource } from "@/lib/users-data-source";
import { useUsersStore } from "../store/usersStore";
import { toast } from "sonner";

const source = getUsersDataSource();

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination when filter set changes
    setPage(1);
  }, [filters, pageSize]);

  const q = useQuery({
    queryKey: ["users", "module", source, params],
    queryFn: async () => {
      if (source === "supabase") {
        return supabaseAdminUsers.list(params);
      }
      return adminApi.users.list(params);
    },
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  return { ...q, page, setPage, params };
}

export function useUsersSupabaseStats(enabled: boolean) {
  return useQuery({
    queryKey: ["users", "supabase-stats"],
    queryFn: () => supabaseAdminUsers.stats(),
    enabled: enabled && source === "supabase",
    staleTime: 60_000,
  });
}

export function useUserDetail360(id: string | null) {
  return useQuery({
    queryKey: ["user", "360", source, id],
    queryFn: async () => {
      if (source === "supabase") {
        return supabaseAdminUsers.get(id!);
      }
      return adminApi.users.get(id!);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ["user", "activity", source, userId],
    queryFn: async () => {
      if (source === "supabase") {
        return supabaseAdminUsers.activity(userId!, { limit: 50 });
      }
      return adminApi.users.activity(userId!, { limit: 50 });
    },
    enabled: !!userId,
  });
}

export function useUserAnalyticsDrawer(userId: string | null, days = 30) {
  return useQuery({
    queryKey: ["user", "analytics", source, userId, days],
    queryFn: () => supabaseAdminUsers.analytics(userId!, days),
    enabled: !!userId && source === "supabase",
    staleTime: 60_000,
  });
}

export function useUserMedia(userId: string | null) {
  return useQuery({
    queryKey: ["user", "media", userId],
    queryFn: () => adminApi.users.media(userId!, { limit: 48 }),
    enabled: !!userId && source !== "supabase",
  });
}

export function useUserTagMutations(userId: string | null) {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (tag: string) =>
      source === "supabase"
        ? supabaseAdminUsers.addTag(userId!, tag)
        : adminApi.users.addTag(userId!, tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", userId] });
      qc.invalidateQueries({ queryKey: ["user", "360", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Tag ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (tag: string) =>
      source === "supabase"
        ? supabaseAdminUsers.removeTag(userId!, tag)
        : adminApi.users.removeTag(userId!, tag),
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
    mutationFn: (content: string) =>
      source === "supabase"
        ? supabaseAdminUsers.createNote(userId!, content, false)
        : adminApi.users.createNote(userId!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", "360", userId] });
      toast.success("Note enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUsersBulkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { user_ids: string[]; action: string; payload?: Record<string, unknown> }) =>
      source === "supabase"
        ? supabaseAdminUsers.bulk(args.user_ids, args.action, args.payload)
        : adminApi.users.bulk(args.user_ids, args.action, args.payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Action « ${vars.action} » appliquée`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
