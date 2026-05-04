import axios, { type AxiosResponse } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStore = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("admin_token");
  },
  set: (token: string) => {
    if (typeof window !== "undefined") sessionStorage.setItem("admin_token", token);
  },
  clear: () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("admin_token");
  },
};

// ─── Request interceptor — attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 ───────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      tokenStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Helper to unwrap {success, data, message} envelope ─────────────────────
function unwrap<T>(res: AxiosResponse): T {
  return res.data?.data ?? res.data;
}

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  // AUTH
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiClient.post("/admin/auth/login", { email, password });
      return unwrap<{ access_token: string; admin: Record<string, unknown> }>(res);
    },
    me: async () => {
      const res = await apiClient.get("/admin/auth/me");
      return unwrap<Record<string, unknown>>(res);
    },
  },

  // DASHBOARD
  dashboard: {
    kpis: async () => {
      const res = await apiClient.get("/admin/dashboard/kpis");
      return unwrap<{
        kpis: Record<string, number>;
        daily_trend: Array<Record<string, unknown>>;
        plan_distribution: Array<Record<string, unknown>>;
        last_hour_requests: number;
      }>(res);
    },
    realtime: async () => {
      const res = await apiClient.get("/admin/dashboard/realtime");
      return unwrap<{ datapoints: Array<Record<string, unknown>>; total: number }>(res);
    },
  },

  // USERS
  users: {
    list: async (params: {
      page?: number;
      page_size?: number;
      search?: string;
      plan?: string;
      status?: string;
      country_code?: string;
      tags?: string;
      date_from?: string;
      date_to?: string;
      sort?: string;
      order?: string;
      cursor?: string;
    }) => {
      const res = await apiClient.get("/admin/users", { params });
      return unwrap<{
        users: Array<Record<string, unknown>>;
        pagination: {
          page: number;
          page_size: number;
          total: number | null;
          total_pages: number | null;
          next_cursor?: string | null;
          has_more?: boolean;
          mode?: string;
        };
        stats?: Record<string, unknown>;
      }>(res);
    },
    get: async (id: string) => {
      const res = await apiClient.get(`/admin/users/${id}`);
      return unwrap<Record<string, unknown>>(res);
    },
    activity: async (id: string, params?: { page?: number; limit?: number }) => {
      const res = await apiClient.get(`/admin/users/${id}/activity`, { params });
      return unwrap<{ events: Array<Record<string, unknown>>; page: number }>(res);
    },
    media: async (id: string, params?: { page?: number; limit?: number }) => {
      const res = await apiClient.get(`/admin/users/${id}/media`, { params });
      return unwrap<{ items: Array<Record<string, unknown>>; page: number }>(res);
    },
    createNote: async (id: string, content: string) => {
      const res = await apiClient.post(`/admin/users/${id}/notes`, { content });
      return unwrap<Record<string, unknown>>(res);
    },
    addTag: async (id: string, tag: string) => {
      const res = await apiClient.post(`/admin/users/${id}/tags`, {}, { params: { tag } });
      return unwrap<Record<string, unknown>>(res);
    },
    removeTag: async (id: string, tag: string) => {
      const res = await apiClient.delete(`/admin/users/${id}/tags/${encodeURIComponent(tag)}`);
      return unwrap<Record<string, unknown>>(res);
    },
    action: async (id: string, action: string, params?: Record<string, unknown>) => {
      const res = await apiClient.post(`/admin/users/${id}/actions`, { action, params });
      return unwrap<Record<string, unknown>>(res);
    },
    exportBlob: async (format: "csv" | "json" = "csv") => {
      const res = await apiClient.get("/admin/users-export/stream", {
        params: { format },
        responseType: "blob",
      });
      return res.data as Blob;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const res = await apiClient.put(`/admin/users/${id}`, data);
      return unwrap<Record<string, unknown>>(res);
    },
    ban: async (id: string, reason: string, duration = "permanent") => {
      const res = await apiClient.post(`/admin/users/${id}/ban`, { reason, duration });
      return unwrap<Record<string, unknown>>(res);
    },
    deleteData: async (id: string) => {
      const res = await apiClient.delete(`/admin/users/${id}/data`);
      return unwrap<Record<string, unknown>>(res);
    },
    bulk: async (user_ids: string[], action: string, payload?: Record<string, unknown>) => {
      const res = await apiClient.post("/admin/users/bulk", { user_ids, action, payload });
      return unwrap<Record<string, unknown>>(res);
    },
    nlSearch: async (body: {
      query: string;
      search?: string;
      plan?: string;
      status?: string;
      country_code?: string;
      date_from?: string;
      date_to?: string;
      tags?: string;
    }) => {
      const res = await apiClient.post("/admin/users/nl-search", body);
      return unwrap<{
        parsed_filters: Record<string, unknown>;
        effective_filters: Record<string, unknown>;
        result_count: number;
        latency_ms: number;
        model_version: string;
        notes?: string;
      }>(res);
    },
  },

  assistant: {
    chat: async (message: string, conversationId?: string) => {
      const res = await apiClient.post("/admin/assistant/chat", {
        message,
        conversation_id: conversationId,
      });
      return unwrap<{ reply: string; sources: string[]; model: string }>(res);
    },
  },

  // ANALYTICS
  analytics: {
    daily: async (days = 30) => {
      const res = await apiClient.get("/admin/analytics/daily", { params: { days } });
      return unwrap<{ data: Array<Record<string, unknown>> }>(res);
    },
    cohorts: async (months = 6) => {
      const res = await apiClient.get("/admin/analytics/cohorts", { params: { months } });
      return unwrap<{ cohorts: Array<Record<string, unknown>> }>(res);
    },
    funnel: async (days = 30) => {
      const res = await apiClient.get("/admin/analytics/funnel", { params: { days } });
      return unwrap<{ stages: Array<Record<string, unknown>>; period_days?: number }>(res);
    },
    geo: async () => {
      const res = await apiClient.get("/admin/analytics/geo");
      return unwrap<{
        by_language: Array<Record<string, unknown>>;
        by_country: Array<Record<string, unknown>>;
        total: number;
      }>(res);
    },
  },

  // MODELS
  models: {
    stats: async () => {
      const res = await apiClient.get("/admin/models/stats");
      return unwrap<{ models: Array<Record<string, unknown>> }>(res);
    },
    endpoints: async () => {
      const res = await apiClient.get("/admin/models/endpoints");
      return unwrap<{ endpoints: Array<Record<string, unknown>> }>(res);
    },
    usageTrend: async (model?: string, days = 7) => {
      const res = await apiClient.get("/admin/models/usage-trend", {
        params: { model, days },
      });
      return unwrap<{ trend: Array<Record<string, unknown>> }>(res);
    },
  },

  // MODERATION
  moderation: {
    queue: async (params: {
      status_filter?: string;
      page?: number;
      page_size?: number;
      content_type?: string;
    }) => {
      const res = await apiClient.get("/admin/moderation/queue", { params });
      return unwrap<{
        items: Array<Record<string, unknown>>;
        pagination: Record<string, number>;
      }>(res);
    },
    decide: async (itemId: string, decision: string, reason?: string) => {
      const res = await apiClient.post(`/admin/moderation/${itemId}/decide`, { decision, reason });
      return unwrap<Record<string, unknown>>(res);
    },
    stats: async () => {
      const res = await apiClient.get("/admin/moderation/stats");
      return unwrap<Record<string, unknown>>(res);
    },
  },

  // BILLING
  billing: {
    overview: async () => {
      const res = await apiClient.get("/admin/billing/overview");
      return unwrap<Record<string, unknown>>(res);
    },
    usage: async (days = 30) => {
      const res = await apiClient.get("/admin/billing/usage", { params: { days } });
      return unwrap<Record<string, unknown>>(res);
    },
  },

  // SYSTEM
  system: {
    health: async () => {
      const res = await apiClient.get("/admin/system/health");
      return unwrap<{
        services: Array<Record<string, unknown>>;
        metrics: Record<string, number>;
      }>(res);
    },
    logs: async (params: {
      hours?: number;
      endpoint?: string;
      status_code_gte?: number;
    }) => {
      const res = await apiClient.get("/admin/system/logs", { params });
      return unwrap<{ logs: Array<Record<string, unknown>> }>(res);
    },
  },

  // AUDIT
  audit: {
    logs: async (params: {
      page?: number;
      page_size?: number;
      action?: string;
      admin_email?: string;
      entity_type?: string;
    }) => {
      const res = await apiClient.get("/admin/audit/logs", { params });
      return unwrap<{ logs: Array<Record<string, unknown>> }>(res);
    },
  },

  // TEAM
  team: {
    list: async () => {
      const res = await apiClient.get("/admin/team");
      return unwrap<{ team: Array<Record<string, unknown>> }>(res);
    },
  },

  // SETTINGS
  settings: {
    list: async () => {
      const res = await apiClient.get("/admin/settings");
      return unwrap<{ settings: Array<Record<string, unknown>> }>(res);
    },
    update: async (key: string, value: unknown, description?: string) => {
      const res = await apiClient.put(`/admin/settings/${key}`, { value, description });
      return unwrap<Record<string, unknown>>(res);
    },
  },

  // CONVERSATIONS
  conversations: {
    list: async (params: { user_id?: string; page?: number; page_size?: number }) => {
      const res = await apiClient.get("/admin/conversations", { params });
      return unwrap<{ conversations: Array<Record<string, unknown>> }>(res);
    },
    messages: async (sessionId: string) => {
      const res = await apiClient.get(`/admin/conversations/${sessionId}/messages`);
      return unwrap<{ session: Record<string, unknown>; messages: Array<Record<string, unknown>> }>(res);
    },
  },
};
