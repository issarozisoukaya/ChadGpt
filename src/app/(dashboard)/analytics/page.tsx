"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatNumber } from "@/lib/utils";
import {
  useDashboardKpis,
  useAnalyticsDaily,
  useAnalyticsCohorts,
  useAnalyticsFunnel,
  useAnalyticsGeo,
} from "@/hooks/useAdminData";
import { TrendingUp, Users, Activity, Target, RefreshCw, BarChart3, Globe2 } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9"];

function getCohortColor(value: number | null) {
  if (value === null || Number.isNaN(value)) return "bg-neutral-100 dark:bg-slate-800 text-neutral-400";
  if (value >= 90) return "bg-emerald-500 text-white";
  if (value >= 80) return "bg-emerald-400 text-white";
  if (value >= 70) return "bg-yellow-400 text-neutral-900";
  if (value >= 60) return "bg-orange-400 text-white";
  return "bg-red-400 text-white";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
};

function langLabel(code: string) {
  const m: Record<string, string> = {
    fr: "Français",
    en: "English",
    ar: "العربية",
    es: "Español",
    de: "Deutsch",
    pt: "Português",
  };
  return m[code] ?? code?.toUpperCase() ?? "—";
}

export default function AnalyticsPage() {
  const [periodDays, setPeriodDays] = useState(30);

  const {
    data: kpiData,
    isLoading: kpiLoading,
    isError: kpiError,
    refetch: refetchKpis,
  } = useDashboardKpis();
  const {
    data: dailyRes,
    isLoading: dailyLoading,
    isError: dailyError,
    refetch: refetchDaily,
  } = useAnalyticsDaily(periodDays);
  const {
    data: cohortsRes,
    isLoading: cohortsLoading,
    isError: cohortsError,
    refetch: refetchCohorts,
  } = useAnalyticsCohorts(6);
  const {
    data: funnelRes,
    isLoading: funnelLoading,
    isError: funnelError,
    refetch: refetchFunnel,
  } = useAnalyticsFunnel(periodDays);
  const {
    data: geoRes,
    isLoading: geoLoading,
    isError: geoError,
    refetch: refetchGeo,
  } = useAnalyticsGeo();

  const kpis = kpiData?.kpis as Record<string, number> | undefined;
  const planDist = useMemo(
    () =>
      (kpiData?.plan_distribution as Array<{ plan: string; user_count: number; percentage?: number }> | undefined) ??
      [],
    [kpiData?.plan_distribution]
  );

  const dailyRows = useMemo(() => {
    const raw = (dailyRes?.data as Array<Record<string, unknown>> | undefined) ?? [];
    return [...raw].reverse().map((row) => {
      const d = row.date as string;
      const short =
        d?.length >= 10
          ? d.slice(5, 10)
          : d ?? "";
      return {
        date: short,
        dateFull: d,
        active_users: Number(row.active_users ?? 0),
        total_requests: Number(row.total_requests ?? 0),
        total_tokens: Number(row.total_tokens ?? 0),
      };
    });
  }, [dailyRes]);

  const funnelStages = (funnelRes?.stages as Array<{ stage: string; users: number; conversion: number }> | undefined) ?? [];

  const cohortRows = (cohortsRes?.cohorts as Array<Record<string, unknown>> | undefined) ?? [];

  const geoRows = useMemo(() => {
    const raw = (geoRes?.by_language as Array<{ language?: string; count: number }> | undefined) ?? [];
    const sorted = [...raw].sort((a, b) => b.count - a.count);
    const max = sorted[0]?.count ?? 1;
    return sorted.map((r) => ({
      ...r,
      label: langLabel(r.language ?? ""),
      max,
    }));
  }, [geoRes]);

  const countryRows = useMemo(() => {
    const raw = (geoRes?.by_country as Array<{ country?: string; count: number }> | undefined) ?? [];
    const sorted = [...raw].sort((a, b) => b.count - a.count);
    const max = sorted[0]?.count ?? 1;
    return sorted.map((r) => ({ ...r, max }));
  }, [geoRes]);

  const planChartData = useMemo(
    () =>
      planDist.map((p) => ({
        channel: p.plan ? p.plan.charAt(0).toUpperCase() + p.plan.slice(1) : "—",
        users: p.user_count,
        revenue: p.user_count,
      })),
    [planDist]
  );

  const conversionPct = useMemo(() => {
    const total = planDist.reduce((s, p) => s + p.user_count, 0);
    if (!total) return 0;
    const paid = planDist.filter((p) => p.plan && p.plan !== "free").reduce((s, p) => s + p.user_count, 0);
    return (paid / total) * 100;
  }, [planDist]);

  const chartSlice = useMemo(() => {
    const take = Math.min(periodDays, dailyRows.length || 0);
    if (take <= 0) return [];
    return dailyRows.slice(-take);
  }, [dailyRows, periodDays]);

  const loadError = kpiError || dailyError || cohortsError || funnelError || geoError;
  const refetchAll = () => {
    void refetchKpis();
    void refetchDaily();
    void refetchCohorts();
    void refetchFunnel();
    void refetchGeo();
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <span>Une ou plusieurs sources analytics n’ont pas pu être chargées (réseau ou session admin).</span>
          <Button variant="outline" size="sm" onClick={() => refetchAll()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Réessayer
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => refetchAll()} disabled={kpiLoading && dailyLoading}>
          <RefreshCw className={cn("h-3.5 w-3.5", (kpiLoading || dailyLoading) && "animate-spin")} />
        </Button>
      </div>

      {/* KPIs — données fn_dashboard_kpis + dérivés plan_distribution */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="New users (month)"
          value={Number(kpis?.new_users_month ?? 0)}
          icon={<Users className="h-4 w-4" />}
          description="Créations ce mois (users)"
        />
        <StatCard
          title="Active users (today)"
          value={Number(kpis?.active_users_today ?? 0)}
          icon={<Activity className="h-4 w-4" />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          description="Distincts sur usage_logs (jour UTC)"
        />
        <StatCard
          title="Paid share"
          value={Math.round(conversionPct * 10) / 10}
          format="percent"
          icon={<Target className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          description="Non-free / total (plans)"
        />
        <StatCard
          title="API requests (month)"
          value={Number(kpis?.total_requests_month ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          description="usage_logs (mois en cours)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>Conversion funnel</CardTitle>
            <Badge variant="info">{periodDays} days</Badge>
          </CardHeader>
          <div className="mt-2 space-y-3">
            {funnelLoading && (
              <p className="text-sm text-neutral-500">Chargement du funnel…</p>
            )}
            {!funnelLoading && funnelStages.length === 0 && (
              <p className="text-sm text-neutral-500">Aucune donnée funnel pour cette période.</p>
            )}
            {funnelStages.map((stage, i) => {
              const base = funnelStages[0]?.users ?? 1;
              const pct = (stage.users / base) * 100;
              const prev = i > 0 ? funnelStages[i - 1].users : 0;
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-neutral-500">{formatNumber(stage.users)}</span>
                      <span className="w-10 text-right text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {stage.conversion}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 overflow-hidden rounded-lg bg-neutral-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                      }}
                    />
                    {i > 0 && prev > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-500">
                        {((stage.users / prev) * 100).toFixed(0)}% retained
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="xl:col-span-3" padding="md">
          <CardHeader>
            <CardTitle>Activity trend</CardTitle>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { label: "7D", days: 7 },
                { label: "30D", days: 30 },
                { label: "90D", days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPeriodDays(days)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    periodDays === days
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          {dailyLoading ? (
            <p className="py-16 text-center text-sm text-neutral-500">Chargement des séries journalières…</p>
          ) : chartSlice.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">
              Pas encore de points journaliers (usage_logs / <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">fn_daily_stats</code>
              ).
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartSlice} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip content={customTooltip} />
                <Bar dataKey="active_users" name="Active users" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Usage retention cohorts</CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500">
              % d’utilisateurs actifs par rapport à la taille de cohorte (usage_logs) — fn_user_cohort_retention
            </p>
          </div>
          <Badge variant="info">{cohortRows.length} cohorts</Badge>
        </CardHeader>
        {cohortsLoading ? (
          <p className="py-8 text-center text-sm text-neutral-500">Chargement des cohortes…</p>
        ) : cohortRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">Aucune cohorte à afficher (données usage_logs insuffisantes).</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="whitespace-nowrap py-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Cohort
                  </th>
                  <th className=" whitespace-nowrap px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Size
                  </th>
                  {["Month 0", "Month 1", "Month 2", "Month 3", "Month 6", "Month 12"].map((m) => (
                    <th
                      key={m}
                      className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-neutral-500"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {cohortRows.map((cohort) => {
                  const label = String(cohort.cohort_month ?? cohort.cohort ?? "—");
                  const size = Number(cohort.cohort_size ?? 0);
                  const cells = [cohort.m0, cohort.m1, cohort.m2, cohort.m3, cohort.m6, cohort.m12].map((v) =>
                    v === null || v === undefined ? null : Number(v)
                  );
                  return (
                    <tr key={label}>
                      <td className="whitespace-nowrap py-3 pr-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {label}
                      </td>
                      <td className="px-2 py-2 text-center tabular-nums text-neutral-600 dark:text-neutral-400">
                        {formatNumber(size)}
                      </td>
                      {cells.map((val, idx) => (
                        <td key={idx} className="px-2 py-2 text-center">
                          {val !== null && !Number.isNaN(val) ? (
                            <span
                              className={cn(
                                "inline-flex h-8 w-14 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                                getCohortColor(val)
                              )}
                            >
                              {val}%
                            </span>
                          ) : (
                            <span className="inline-flex h-8 w-14 items-center justify-center rounded-lg bg-neutral-50 text-xs text-neutral-300 dark:bg-slate-800 dark:text-neutral-600">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>Legend:</span>
          {[
            { label: "≥90%", color: "bg-emerald-500" },
            { label: "≥80%", color: "bg-emerald-400" },
            { label: "≥70%", color: "bg-yellow-400" },
            { label: "≥60%", color: "bg-orange-400" },
            { label: "<60%", color: "bg-red-400" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={cn("h-3 w-3 rounded", l.color)} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-neutral-500" />
              Users by language
            </CardTitle>
            <Badge variant="default">{formatNumber(geoRes?.total ?? 0)} users</Badge>
          </CardHeader>
          {geoLoading ? (
            <p className="py-8 text-center text-sm text-neutral-500">Chargement…</p>
          ) : geoRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">Aucune donnée langue sur les profils.</p>
          ) : (
            <div className="space-y-3">
              {geoRows.map((row, i) => (
                <div key={row.language ?? i} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm tabular-nums text-neutral-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{row.label}</span>
                      <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatNumber(row.count)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(row.count / row.max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Users by country
            </CardTitle>
            <Badge variant="info">ISO country_code</Badge>
          </CardHeader>
          {geoLoading ? (
            <p className="py-8 text-center text-sm text-neutral-500">Chargement…</p>
          ) : countryRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              Aucun <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">country_code</code> renseigné — exécutez la migration 009 ou mettez à jour les profils.
            </p>
          ) : (
            <div className="space-y-3">
              {countryRows.map((row, i) => (
                <div key={row.country ?? i} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm tabular-nums text-neutral-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {row.country ?? "—"}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatNumber(row.count)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(row.count / row.max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-500" />
              Plan distribution
            </CardTitle>
            <Badge variant="success">{planDist.length} plans</Badge>
          </CardHeader>
          {kpiLoading ? (
            <p className="py-8 text-center text-sm text-neutral-500">Chargement…</p>
          ) : planChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">Aucune répartition de plan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={planChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 72, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                />
                <Tooltip
                  formatter={(v: unknown) => [formatNumber(Number(v)), "Users"]}
                  contentStyle={{
                    background: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="users" name="Users" radius={[0, 4, 4, 0]}>
                  {planChartData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
