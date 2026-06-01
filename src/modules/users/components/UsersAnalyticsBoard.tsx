"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardKpis } from "@/hooks/useAdminData";
import { useAnalyticsDaily } from "@/hooks/useAdminData";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Users, Activity, TrendingUp, Percent, DollarSign, HeartPulse } from "lucide-react";

export function UsersAnalyticsBoard() {
  const { data: kpiData } = useDashboardKpis();
  const { data: daily } = useAnalyticsDaily(30);
  const kpis = kpiData?.kpis as Record<string, number> | undefined;

  const chartData = useMemo(() => {
    const rows = daily?.data ?? [];
    return rows.map((r) => ({
      day: String(r.date ?? r.day ?? "").slice(5),
      users: Number(r.new_users ?? r.signups ?? 0),
      active: Number(r.active_users ?? r.dau ?? 0),
    }));
  }, [daily]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total utilisateurs"
          value={kpis?.total_users ?? 0}
          icon={<Users className="h-4 w-4" />}
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
        <StatCard
          title="MAU (approx.)"
          value={kpis?.active_users_month ?? 0}
          icon={<Activity className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
        <StatCard
          title="Nouveaux (mois)"
          value={kpis?.new_users_month ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
        <StatCard
          title="Rétention"
          value={0}
          description="Branchez cohortes /admin/analytics/cohorts"
          icon={<Percent className="h-4 w-4" />}
          iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
        <StatCard
          title="MRR"
          value={0}
          description="Vue Revenue /billing"
          icon={<DollarSign className="h-4 w-4" />}
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
        <StatCard
          title="File modération"
          value={kpis?.moderation_pending ?? 0}
          icon={<HeartPulse className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/50">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Tendance 30 jours</p>
        <p className="text-xs text-neutral-500">Inscriptions / activité — /admin/analytics/daily</p>
        <div className="mt-4 h-64 min-h-64 w-full min-w-0 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="u1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-slate-700" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="currentColor" className="text-neutral-400" />
              <YAxis tick={{ fontSize: 10 }} stroke="currentColor" className="text-neutral-400" width={32} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--tw-prose-borders, #e5e5e5)",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="active" stroke="rgb(34, 197, 94)" fill="rgb(34, 197, 94)" fillOpacity={0.12} name="Actifs" />
              <Area type="monotone" dataKey="users" stroke="rgb(139, 92, 246)" fill="url(#u1)" name="Nouveaux" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
