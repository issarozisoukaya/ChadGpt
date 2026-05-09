import type { SupabaseClient } from "@supabase/supabase-js";
import { mapUserRow, uuidLooksLike } from "../user-mapper";

export interface AdminUsersListParams {
  page: number;
  pageSize: number;
  search?: string;
  plan?: string;
  status?: string;
  countryCode?: string;
  tags?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: string;
  order: "asc" | "desc";
}

const SORT_COLUMNS: Record<string, string> = {
  email: "email",
  plan: "subscription_tier",
  total_tokens_used: "credits_used_total",
  requests_today: "monthly_requests_count",
  created_at: "created_at",
  risk_score: "risk_score",
  last_activity: "last_active_at",
};

function resolveSortColumn(sort: string): string {
  return SORT_COLUMNS[sort] ?? "last_active_at";
}

async function userIdsMatchingAllTags(
  supabase: SupabaseClient,
  tags: string[]
): Promise<string[] | null> {
  if (tags.length === 0) return null;

  let intersection: Set<string> | null = null;
  for (const tag of tags) {
    const { data, error } = await supabase.from("user_tags").select("user_id").eq("tag", tag);
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) return null;
      throw error;
    }
    const set = new Set<string>((data ?? []).map((r: { user_id: string }) => r.user_id));
    intersection =
      intersection === null
        ? set
        : new Set<string>(
            Array.from(intersection).filter((id): id is string => typeof id === "string" && set.has(id))
          );
    if (intersection.size === 0) return [];
  }
  return intersection ? [...intersection] : [];
}

async function userIdsFromNotesSearch(supabase: SupabaseClient, q: string): Promise<string[]> {
  const needle = q.trim();
  if (!needle) return [];
  const { data, error } = await supabase
    .from("user_notes")
    .select("user_id")
    .ilike("note", `%${needle}%`);
  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) return [];
    throw error;
  }
  return [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
}

export async function fetchAdminUsersList(supabase: SupabaseClient, params: AdminUsersListParams) {
  const from = Math.max(0, (params.page - 1) * params.pageSize);
  const to = from + params.pageSize - 1;
  const sortCol = resolveSortColumn(params.sort);
  const ascending = params.order === "asc";

  const tagList = (params.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let tagFilteredIds: string[] | null = null;
  if (tagList.length > 0) {
    tagFilteredIds = await userIdsMatchingAllTags(supabase, tagList);
    if (tagFilteredIds?.length === 0) {
      return {
        users: [] as Record<string, unknown>[],
        pagination: {
          page: params.page,
          page_size: params.pageSize,
          total: 0,
          total_pages: 0,
          mode: "supabase",
        },
      };
    }
  }

  const searchTrim = params.search?.trim() ?? "";
  const noteIds =
    searchTrim.length >= 2 ? await userIdsFromNotesSearch(supabase, searchTrim) : [];

  let query = supabase.from("users").select("*", { count: "exact" });

  if (tagFilteredIds && tagFilteredIds.length > 0) {
    query = query.in("id", tagFilteredIds);
  }

  if (params.plan && params.plan !== "all") {
    query = query.eq("subscription_tier", params.plan);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.countryCode?.trim()) {
    const cc = params.countryCode.trim().toUpperCase();
    query = query.or(`country.eq.${cc},country_code.eq.${cc}`);
  }

  if (params.dateFrom) {
    query = query.gte("created_at", params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte("created_at", params.dateTo);
  }

  if (searchTrim) {
    const esc = searchTrim.replace(/,/g, "\\,");
    const orParts = [`email.ilike.%${esc}%`, `full_name.ilike.%${esc}%`, `phone.ilike.%${esc}%`];
    if (uuidLooksLike(searchTrim)) {
      orParts.push(`id.eq.${searchTrim}`);
    }
    const cappedNote = noteIds.slice(0, 400);
    if (cappedNote.length > 0) {
      orParts.push(`id.in.(${cappedNote.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  query = query.order(sortCol, { ascending, nullsFirst: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const users = (data ?? []).map((row) => mapUserRow(row as Record<string, unknown>));
  const total = count ?? 0;

  return {
    users,
    pagination: {
      page: params.page,
      page_size: params.pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / params.pageSize)),
      mode: "supabase",
    },
  };
}

export async function fetchAdminUsersStats(supabase: SupabaseClient) {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const isoMonth = monthAgo.toISOString();

  const totalQ = await supabase.from("users").select("*", { count: "exact", head: true });
  const newMonthQ = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", isoMonth);

  let activeMonthQ = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("last_active_at", isoMonth);
  if (activeMonthQ.error) {
    activeMonthQ = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_login_at", isoMonth);
  }

  const activeStatusQ = await supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "active");

  if (totalQ.error) throw totalQ.error;
  if (newMonthQ.error) throw newMonthQ.error;
  if (activeMonthQ.error) throw activeMonthQ.error;
  if (activeStatusQ.error) throw activeStatusQ.error;

  const kpis = {
    total_users: totalQ.count ?? 0,
    new_users_month: newMonthQ.count ?? 0,
    active_users_month: activeMonthQ.count ?? 0,
    active_users_today: activeStatusQ.count ?? 0,
    moderation_pending: 0,
    revenue_fcfa_total: 0,
  };

  const revSample = await supabase.from("users").select("total_revenue_fcfa").limit(5000);
  if (!revSample.error && revSample.data?.length) {
    kpis.revenue_fcfa_total = revSample.data.reduce(
      (acc, row: { total_revenue_fcfa?: number | string | null }) =>
        acc + (Number(row.total_revenue_fcfa) || 0),
      0
    );
  }

  return kpis;
}

function computeScoresFromUser(row: Record<string, unknown>) {
  const monthly = Number(row.monthly_requests_count ?? 0) || 0;
  const limit = Math.max(1, Number(row.monthly_requests_limit ?? 100) || 100);
  const engagement_score = Math.min(100, (monthly / limit) * 100);

  const last =
    (row.last_active_at as string | undefined) ??
    (row.last_login_at as string | undefined) ??
    (row.created_at as string | undefined);
  let churn_risk = 25;
  if (last) {
    const days = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    churn_risk = Math.min(100, Math.round(days * 3));
  }

  const health_label =
    Number(row.risk_score ?? 0) > 70 ? "attention" : churn_risk > 60 ? "fragile" : "correct";

  return {
    engagement_score,
    churn_risk,
    health_label,
    risk_score: Number(row.risk_score ?? 0) || 0,
  };
}

export async function fetchUserDetailBundle(supabase: SupabaseClient, userId: string) {
  const { data: userRaw, error: userErr } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!userRaw) {
    const err = new Error("Utilisateur introuvable");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }

  const userRow = userRaw as Record<string, unknown>;

  const tagsRes = await supabase.from("user_tags").select("tag").eq("user_id", userId);
  const notesRes = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  const logsRes = await supabase
    .from("user_activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  const sessionsRes = await supabase
    .from("user_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const paymentsRes = await supabase
    .from("user_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);

  const mappedUser = mapUserRow(userRow) as Record<string, unknown>;

  if (!sessionsRes.error && sessionsRes.count != null) {
    mappedUser.total_sessions = sessionsRes.count;
  }

  const recent_usage = (logsRes.data ?? []).map((l: Record<string, unknown>) => ({
    endpoint: String(l.action_type ?? "event"),
    status_code: 200,
    created_at: l.created_at,
    category: l.action_category,
  }));

  const tagsOk = tagsRes.error ? [] : tagsRes.data ?? [];
  const notesRaw = notesRes.error ? [] : notesRes.data ?? [];
  const notesOk = notesRaw.map((n: Record<string, unknown>) => ({
    ...n,
    content: (n.note ?? n.content ?? "") as string,
  }));

  const scores = computeScoresFromUser(userRow);
  const ltv =
    userRow.lifetime_value_fcfa != null
      ? `${Number(userRow.lifetime_value_fcfa).toLocaleString("fr-FR")} FCFA`
      : userRow.total_revenue_fcfa != null
        ? `${Number(userRow.total_revenue_fcfa).toLocaleString("fr-FR")} FCFA`
        : "—";

  return {
    user: mappedUser,
    tags: tagsOk,
    admin_notes: notesOk,
    predictions: {
      engagement_score: scores.engagement_score,
      churn_risk: scores.churn_risk,
      health_label: scores.health_label,
      ltv_estimate_usd: ltv,
      model_version: "supabase-metrics-v1",
    },
    scores,
    recent_usage,
    payments: paymentsRes.error ? [] : paymentsRes.data ?? [],
  };
}

export async function fetchUserActivityFeed(supabase: SupabaseClient, userId: string, limit: number) {
  const lim = Math.min(Math.max(limit || 50, 1), 200);
  const { data, error } = await supabase
    .from("user_activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) throw error;

  const events = (data ?? []).map((l: Record<string, unknown>) => ({
    title: String(l.action_type ?? "activity"),
    at: l.created_at,
    category: l.action_category,
    details: l.details,
    ip_address: l.ip_address,
    device_type: l.device_type,
  }));

  return { events, page: 1 };
}

export async function fetchUserUsageSeries(supabase: SupabaseClient, userId: string, days: number) {
  const d = Math.min(Math.max(days, 7), 90);
  const start = new Date();
  start.setDate(start.getDate() - d);
  const iso = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("user_api_usage")
    .select("date, api_type, requests_count, tokens_used")
    .eq("user_id", userId)
    .gte("date", iso)
    .order("date", { ascending: true });

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return { series: [] as Array<{ date: string; requests: number }>, by_type: {} as Record<string, number> };
    }
    throw error;
  }

  const byDay = new Map<string, number>();
  const byType: Record<string, number> = {};

  for (const row of data ?? []) {
    const r = row as { date: string; api_type: string; requests_count?: number; tokens_used?: number };
    const day = String(r.date).slice(0, 10);
    const rq = Number(r.requests_count ?? r.tokens_used ?? 0) || 0;
    byDay.set(day, (byDay.get(day) ?? 0) + rq);
    byType[r.api_type] = (byType[r.api_type] ?? 0) + rq;
  }

  const series = [...byDay.entries()]
    .map(([date, requests]) => ({ date, requests }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { series, by_type: byType };
}

