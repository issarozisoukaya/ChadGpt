import { tokenStore } from "@/lib/api/client";

const PREFIX = "/api/admin/supabase";

async function sbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body != null && !(init.headers instanceof Headers && init.headers.has("Content-Type"))) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${PREFIX}${path}`, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: T;
  };

  if (!res.ok || json.success === false) {
    throw new Error(json.message || res.statusText || "Erreur réseau");
  }

  return (json.data ?? json) as T;
}

export async function sbFetchBlob(path: string): Promise<Blob> {
  const token = tokenStore.get();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${PREFIX}${path}`, { headers });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(j.message || res.statusText);
  }
  return res.blob();
}

export const supabaseAdminUsers = {
  list: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return sbFetch<{ users: Array<Record<string, unknown>>; pagination: Record<string, unknown>; stats?: unknown }>(
      `/users?${q.toString()}`
    );
  },

  stats: () => sbFetch<{ kpis: Record<string, number> }>(`/users/stats`),

  get: (id: string) =>
    sbFetch<Record<string, unknown>>(`/users/${encodeURIComponent(id)}`),

  activity: (id: string, opts?: { limit?: number }) =>
    sbFetch<{ events: unknown[]; page: number }>(
      `/users/${encodeURIComponent(id)}/activity?limit=${opts?.limit ?? 50}`
    ),

  analytics: (id: string, days = 30) =>
    sbFetch<{
      series: Array<{ date: string; requests: number }>;
      features_pct: Record<string, number>;
      recent_events: unknown[];
    }>(`/users/${encodeURIComponent(id)}/analytics?days=${days}`),

  update: (id: string, patch: Record<string, unknown>) =>
    sbFetch<Record<string, unknown>>(`/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  addTag: (id: string, tag: string) =>
    sbFetch<unknown>(`/users/${encodeURIComponent(id)}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    }),

  removeTag: (id: string, tag: string) =>
    sbFetch<unknown>(`/users/${encodeURIComponent(id)}/tags?tag=${encodeURIComponent(tag)}`, {
      method: "DELETE",
    }),

  createNote: (id: string, content: string, isImportant = false) =>
    sbFetch<unknown>(`/users/${encodeURIComponent(id)}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, is_important: isImportant }),
    }),

  bulk: (user_ids: string[], action: string, payload?: Record<string, unknown>) =>
    sbFetch<{ affected: number; action: string }>(`/users/bulk`, {
      method: "POST",
      body: JSON.stringify({ user_ids, action, payload }),
    }),

  ban: (id: string, reason: string) =>
    sbFetch<unknown>(`/users/${encodeURIComponent(id)}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  deleteData: (id: string) =>
    sbFetch<unknown>(`/users/${encodeURIComponent(id)}/data`, {
      method: "DELETE",
    }),

  exportBlob: (params: Record<string, string | undefined>, format: "csv" | "json", anonymize?: boolean) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, v);
    });
    q.set("format", format);
    if (anonymize) q.set("anonymize", "1");
    return sbFetchBlob(`/users/export?${q.toString()}`);
  },
};
