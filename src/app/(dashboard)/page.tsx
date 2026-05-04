"use client";

import { useMemo } from "react";
import {
  Users,
  Zap,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Globe,
  Activity,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import { useDashboardKpis, useDashboardRealtime, useSystemHealth } from "@/hooks/useAdminData";

const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  purple: "#8b5cf6",
};

const PIE_COLORS = ["#6b7280", "#3b82f6", "#8b5cf6"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {typeof p.value === "number" && p.value > 10000 ? formatNumber(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function SystemStatusRow({ service }: { service: Record<string, unknown> }) {
  const status = service.status as string;
  const cfg = {
    healthy: { color: "bg-emerald-500", label: "Healthy", badge: "success" as const },
    degraded: { color: "bg-amber-500", label: "Degraded", badge: "warning" as const },
    down: { color: "bg-red-500", label: "Down", badge: "error" as const },
    not_configured: { color: "bg-neutral-400", label: "N/A", badge: "default" as const },
    unknown: { color: "bg-neutral-400", label: "Unknown", badge: "default" as const },
  }[status] ?? { color: "bg-neutral-400", label: status, badge: "default" as const };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.color)} />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">{service.service as string}</span>
      </div>
      <div className="flex items-center gap-3">
        {(service.latency_ms as number) > 0 && (
          <span className="text-xs text-neutral-500 tabular-nums">{service.latency_ms as number}ms</span>
        )}
        <Badge variant={cfg.badge} size="sm">{cfg.label}</Badge>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpiData, isLoading: kpiLoading, isError: kpiError, error: kpiErr, refetch: refetchKpis } = useDashboardKpis();
  const { data: realtimeData } = useDashboardRealtime();
  const { data: systemData } = useSystemHealth();

  const kpis = kpiData?.kpis as Record<string, number> | undefined;
  const dailyTrend =
    (kpiData?.daily_trend as Array<Record<string, unknown>> | undefined) ?? [];
  const planDist =
    (kpiData?.plan_distribution as Array<{ plan: string; user_count: number; percentage: number }> | undefined) ??
    [];

  const operationalAlerts = useMemo(() => {
    if (!kpis) return [];
    type AlertRow = {
      id: string;
      type: "error" | "warning" | "info";
      title: string;
      message: string;
      timestamp: string;
      severity: "high" | "medium" | "low";
      resolved: boolean;
    };
    const rows: AlertRow[] = [];
    const er = Number(kpis.error_rate_today_pct ?? 0);
    if (er > 1) {
      rows.push({
        id: "ops-error-rate",
        type: er > 5 ? "error" : "warning",
        title: "API error rate elevated",
        message: `${er}% of requests returned errors today (usage_logs).`,
        timestamp: new Date().toISOString(),
        severity: er > 5 ? "high" : "medium",
        resolved: false,
      });
    }
    const pending = Number(kpis.moderation_pending ?? 0);
    if (pending > 0) {
      rows.push({
        id: "ops-moderation",
        type: "warning",
        title: "Moderation backlog",
        message: `${pending} item(s) pending review in moderation_queue.`,
        timestamp: new Date().toISOString(),
        severity: pending > 50 ? "high" : "medium",
        resolved: false,
      });
    }
    return rows;
  }, [kpis]);

  const realtimePoints = (realtimeData?.datapoints as Array<{ time: string; requests: number }> | undefined) ?? [];
  const services = (systemData?.services as Array<Record<string, unknown>> | undefined) ?? [];
  const sysMetrics = (systemData?.metrics as Record<string, number> | undefined) ?? {};

  // Build plan pie data
  const pieData = planDist.map((p, i) => ({
    name: (p.plan as string).charAt(0).toUpperCase() + (p.plan as string).slice(1),
    value: p.user_count as number,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Refresh bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {kpiError && (
            <span className="text-xs text-red-600 dark:text-red-400" title={(kpiErr as Error)?.message}>
              API indisponible — démarrez le backend (ex. port 8000). {(kpiErr as Error)?.message}
            </span>
          )}
          {kpiLoading && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Loading real data…
            </span>
          )}
          {!kpiLoading && !kpiError && kpis && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Live data from Supabase
            </span>
          )}
        </div>
        <Button variant="ghost" size="xs" onClick={() => refetchKpis()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={kpis?.total_users ?? 0}
          format="number"
          icon={<Users className="h-4 w-4" />}
          description={`${kpis?.active_users_today ?? 0} today`}
        />
        <StatCard
          title="Active Today (DAU)"
          value={kpis?.active_users_today ?? 0}
          format="number"
          icon={<Activity className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="New Users (month)"
          value={kpis?.new_users_month ?? 0}
          format="number"
          icon={<Star className="h-4 w-4" />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="Requests Today"
          value={kpis?.total_requests_today ?? 0}
          format="number"
          icon={<Zap className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Error Rate"
          value={kpis?.error_rate_today_pct ?? 0}
          format="percent"
          icon={<TrendingDown className="h-4 w-4" />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          description={kpis?.error_rate_today_pct === 0 ? "No errors" : "Monitor closely"}
        />
        <StatCard
          title="Moderation Queue"
          value={kpis?.moderation_pending ?? 0}
          format="number"
          icon={<AlertCircle className="h-4 w-4" />}
          iconColor="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          description="Pending review"
        />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Daily Trend */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <div>
              <CardTitle>Daily Activity — Real Data</CardTitle>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {kpis ? "Supabase usage_logs · Last 30 days" : "Loading from database…"}
              </p>
            </div>
            <Badge variant={kpis ? "success" : "default"}>
              {kpis ? "Live" : "Loading"}
            </Badge>
          </CardHeader>
          {dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyTrend as Array<Record<string, unknown>>} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis
                dataKey={(d) => (d as Record<string, unknown>).date ?? (d as Record<string, unknown>).date ?? ""}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNumber(v)}
              />
              <Tooltip content={ChartTooltip} />
              <Area
                type="monotone"
                dataKey="total_requests"
                name="Requests"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#colorReqs)"
              />
              <Area
                type="monotone"
                dataKey="active_users"
                name="Active Users"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-neutral-400 text-sm px-4 text-center">
              {kpiError ? "Impossible de charger les statistiques (API)." : "Aucune donnée d’activité sur la période."}
            </div>
          )}
        </Card>

        {/* Plan Distribution */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <Badge variant="default">{formatNumber(kpis?.total_users ?? 0)} users</Badge>
          </CardHeader>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => [formatNumber(Number(value)), "Users"]}
                    contentStyle={{
                      background: "rgb(15 23 42)",
                      border: "1px solid rgb(51 65 85)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{plan.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatNumber(plan.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-neutral-400 text-sm px-4 text-center">
              {kpiError ? "Impossible de charger les plans (API)." : "Aucune donnée de répartition par plan."}
            </div>
          )}
        </Card>
      </div>

      {/* Real-time + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Real-time requests */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>API Requests · Live</CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">Last 5 minutes · from usage_logs</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-indicator" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {realtimeData?.total ?? 0} req/5m
              </span>
            </div>
          </CardHeader>
          {realtimePoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={realtimePoints} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Area type="monotone" dataKey="requests" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#colorRT)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center text-neutral-400 text-sm">
                <p>No real-time data yet</p>
                <p className="text-xs mt-1">Data appears when users make API calls</p>
              </div>
            </div>
          )}

          {/* System metrics from real data */}
          {Object.keys(sysMetrics).length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 dark:border-slate-800">
              <div className="text-center">
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {sysMetrics.avg_latency_1h_ms ?? 0}ms
                </p>
                <p className="text-xs text-neutral-500">Avg Latency (1h)</p>
              </div>
              <div className="text-center">
                <p className={cn("text-lg font-bold tabular-nums",
                  (sysMetrics.error_rate_5min_pct ?? 0) > 5 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {sysMetrics.error_rate_5min_pct ?? 0}%
                </p>
                <p className="text-xs text-neutral-500">Error Rate (5m)</p>
              </div>
            </div>
          )}
        </Card>

        {/* System Health — Real */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                System Health
              </span>
            </CardTitle>
            {services.length > 0 && (
              <Badge
                variant={
                  services.some((s) => s.status === "down")
                    ? "error"
                    : services.some((s) => s.status === "degraded")
                    ? "warning"
                    : "success"
                }
              >
                {services.some((s) => s.status === "down")
                  ? "Incident"
                  : services.some((s) => s.status === "degraded")
                  ? "Degraded"
                  : "All Systems OK"}
              </Badge>
            )}
          </CardHeader>
          <div className="divide-y divide-neutral-100 dark:divide-slate-800">
            {services.length > 0
              ? services.map((s, i) => <SystemStatusRow key={i} service={s} />)
              : <p className="text-sm text-neutral-400 py-4 text-center">Loading system status…</p>
            }
          </div>
          {sysMetrics.moderation_backlog !== undefined && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Moderation backlog</span>
              <Badge variant={sysMetrics.moderation_backlog > 20 ? "warning" : "success"}>
                {sysMetrics.moderation_backlog} pending
              </Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Geo by language */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Users by Language
              </span>
            </CardTitle>
            <p className="text-xs text-neutral-500">from Supabase users.language</p>
          </CardHeader>
          <div className="space-y-3">
            {(kpis?.users_by_language as Array<{ language: string; count: number }> | undefined)
              ?.sort((a, b) => b.count - a.count)
              ?.map((lang) => {
                const total = (kpis?.total_users ?? 1) as number;
                const pct = (lang.count / total) * 100;
                const langLabels: Record<string, string> = { fr: "🇫🇷 Français", ar: "🇸🇦 العربية", en: "🇬🇧 English" };
                return (
                  <div key={lang.language}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {langLabels[lang.language] ?? lang.language}
                      </span>
                      <div className="flex gap-4 tabular-nums text-neutral-500">
                        <span>{formatNumber(lang.count)}</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) ?? (
              <p className="text-sm text-neutral-400 text-center py-4">No language data yet</p>
            )}
          </div>
        </Card>

        {/* Alerts */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Active Alerts
              </span>
            </CardTitle>
            <Badge variant="warning">
              {operationalAlerts.filter((a) => !a.resolved).length} open
            </Badge>
          </CardHeader>
          <div className="space-y-2">
            {operationalAlerts.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">
                Aucune alerte opérationnelle (données issues des KPIs base de données).
              </p>
            ) : (
            operationalAlerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg",
                  "hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors",
                  alert.resolved && "opacity-50"
                )}
              >
                {alert.type === "error" ? (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                ) : alert.type === "warning" ? (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {alert.title}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{alert.message}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{formatRelativeTime(alert.timestamp)}</p>
                </div>
                <Badge
                  variant={alert.severity === "high" ? "error" : alert.severity === "medium" ? "warning" : "info"}
                  size="sm"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
