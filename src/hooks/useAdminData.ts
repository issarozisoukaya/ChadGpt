"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/client";
import { toast } from "sonner";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QK = {
  dashboardKpis: ["dashboard", "kpis"] as const,
  dashboardRealtime: ["dashboard", "realtime"] as const,
  users: (params: object) => ["users", params] as const,
  user: (id: string) => ["user", id] as const,
  analyticsDaily: (days: number) => ["analytics", "daily", days] as const,
  analyticsCohorts: (months: number) => ["analytics", "cohorts", months] as const,
  analyticsFunnel: (days: number) => ["analytics", "funnel", days] as const,
  analyticsGeo: ["analytics", "geo"] as const,
  modelStats: ["models", "stats"] as const,
  modelEndpoints: ["models", "endpoints"] as const,
  modelTrend: (model: string | undefined, days: number) => ["models", "trend", model, days] as const,
  moderationQueue: (params: object) => ["moderation", "queue", params] as const,
  moderationStats: ["moderation", "stats"] as const,
  billingOverview: ["billing", "overview"] as const,
  billingUsage: (days: number) => ["billing", "usage", days] as const,
  systemHealth: ["system", "health"] as const,
  systemLogs: (params: object) => ["system", "logs", params] as const,
  auditLogs: (params: object) => ["audit", "logs", params] as const,
  team: ["team"] as const,
  settings: ["settings"] as const,
  conversations: (params: object) => ["conversations", params] as const,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboardKpis() {
  return useQuery({
    queryKey: QK.dashboardKpis,
    queryFn: () => adminApi.dashboard.kpis(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useDashboardRealtime() {
  return useQuery({
    queryKey: QK.dashboardRealtime,
    queryFn: () => adminApi.dashboard.realtime(),
    staleTime: 0,
    refetchInterval: 5_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers(params: {
  page?: number;
  page_size?: number;
  search?: string;
  plan?: string;
  status?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: QK.users(params),
    queryFn: () => adminApi.users.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: QK.user(id ?? ""),
    queryFn: () => adminApi.users.get(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, duration }: { id: string; reason: string; duration?: string }) =>
      adminApi.users.ban(id, reason, duration),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur suspendu");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.users.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.user(id) });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur mis à jour");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });
}

export function useDeleteUserData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.users.deleteData(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Données supprimées (RGPD)");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export function useAnalyticsDaily(days = 30) {
  return useQuery({
    queryKey: QK.analyticsDaily(days),
    queryFn: () => adminApi.analytics.daily(days),
    staleTime: 300_000,
  });
}

export function useAnalyticsCohorts(months = 6) {
  return useQuery({
    queryKey: QK.analyticsCohorts(months),
    queryFn: () => adminApi.analytics.cohorts(months),
    staleTime: 600_000,
  });
}

export function useAnalyticsFunnel(days = 30) {
  return useQuery({
    queryKey: QK.analyticsFunnel(days),
    queryFn: () => adminApi.analytics.funnel(days),
    staleTime: 300_000,
  });
}

export function useAnalyticsGeo() {
  return useQuery({
    queryKey: QK.analyticsGeo,
    queryFn: () => adminApi.analytics.geo(),
    staleTime: 300_000,
  });
}

// ─── Models ───────────────────────────────────────────────────────────────────
export function useModelStats() {
  return useQuery({
    queryKey: QK.modelStats,
    queryFn: () => adminApi.models.stats(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useModelEndpoints() {
  return useQuery({
    queryKey: QK.modelEndpoints,
    queryFn: () => adminApi.models.endpoints(),
    staleTime: 60_000,
  });
}

export function useModelTrend(model: string | undefined, days = 7) {
  return useQuery({
    queryKey: QK.modelTrend(model, days),
    queryFn: () => adminApi.models.usageTrend(model, days),
    staleTime: 60_000,
  });
}

// ─── Moderation ───────────────────────────────────────────────────────────────
export function useModerationQueue(params: {
  status_filter?: string;
  page?: number;
  page_size?: number;
  content_type?: string;
}) {
  return useQuery({
    queryKey: QK.moderationQueue(params),
    queryFn: () => adminApi.moderation.queue(params),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useModerationStats() {
  return useQuery({
    queryKey: QK.moderationStats,
    queryFn: () => adminApi.moderation.stats(),
    staleTime: 30_000,
  });
}

export function useModerationDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      decision,
      reason,
    }: {
      itemId: string;
      decision: string;
      reason?: string;
    }) => adminApi.moderation.decide(itemId, decision, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moderation"] });
      toast.success("Décision enregistrée");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function useBillingOverview() {
  return useQuery({
    queryKey: QK.billingOverview,
    queryFn: () => adminApi.billing.overview(),
    staleTime: 120_000,
  });
}

export function useBillingUsage(days = 30) {
  return useQuery({
    queryKey: QK.billingUsage(days),
    queryFn: () => adminApi.billing.usage(days),
    staleTime: 120_000,
  });
}

// ─── System ───────────────────────────────────────────────────────────────────
export function useSystemHealth() {
  return useQuery({
    queryKey: QK.systemHealth,
    queryFn: () => adminApi.system.health(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useSystemLogs(params: {
  hours?: number;
  endpoint?: string;
  status_code_gte?: number;
}) {
  return useQuery({
    queryKey: QK.systemLogs(params),
    queryFn: () => adminApi.system.logs(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export function useAuditLogs(params: {
  page?: number;
  page_size?: number;
  action?: string;
  admin_email?: string;
}) {
  return useQuery({
    queryKey: QK.auditLogs(params),
    queryFn: () => adminApi.audit.logs(params),
    staleTime: 60_000,
  });
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export function useTeam() {
  return useQuery({
    queryKey: QK.team,
    queryFn: () => adminApi.team.list(),
    staleTime: 300_000,
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function useAdminSettings() {
  return useQuery({
    queryKey: QK.settings,
    queryFn: () => adminApi.settings.list(),
    staleTime: 300_000,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      value,
      description,
    }: {
      key: string;
      value: unknown;
      description?: string;
    }) => adminApi.settings.update(key, value, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.settings });
      toast.success("Paramètre mis à jour");
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────
export function useConversations(params: {
  user_id?: string;
  page?: number;
  page_size?: number;
  /** When false, query does not run (e.g. panel closed). */
  enabled?: boolean;
}) {
  const { enabled = true, ...listParams } = params;
  return useQuery({
    queryKey: QK.conversations(listParams),
    queryFn: () => adminApi.conversations.list(listParams),
    staleTime: 30_000,
    enabled,
  });
}
