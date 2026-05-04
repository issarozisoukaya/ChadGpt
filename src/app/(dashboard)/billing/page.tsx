"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn, formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import { revenueTimeSeries, mockTransactions } from "@/lib/mock-data";
import { toast } from "sonner";

const txStatusConfig = {
  success: { icon: CheckCircle2, color: "text-emerald-500", badge: "success" as const },
  pending: { icon: Clock, color: "text-amber-500", badge: "warning" as const },
  failed: { icon: XCircle, color: "text-red-500", badge: "error" as const },
};

const txTypeConfig: Record<string, string> = {
  new_subscription: "New Subscription",
  renewal: "Renewal",
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  refund: "Refund",
};

const mrrWaterfall = [
  { name: "Starting MRR", value: 113_311, color: "#3b82f6", type: "base" },
  { name: "New MRR", value: 18_450, color: "#10b981", type: "positive" },
  { name: "Expansion MRR", value: 8_920, color: "#10b981", type: "positive" },
  { name: "Contraction MRR", value: -3_215, color: "#f59e0b", type: "negative" },
  { name: "Churn MRR", value: -9_932, color: "#ef4444", type: "negative" },
  { name: "Ending MRR", value: 127_534, color: "#8b5cf6", type: "base" },
];

export default function BillingPage() {
  const [txFilter, setTxFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");

  const filteredTx = mockTransactions.filter((tx) => {
    if (txFilter === "all") return true;
    return tx.type === txFilter || tx.status === txFilter;
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MRR"
          value={127_534}
          format="currency"
          change={8.3}
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          description="$1.53M ARR"
        />
        <StatCard
          title="New MRR"
          value={18_450}
          format="currency"
          change={12.4}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          description="234 new customers"
        />
        <StatCard
          title="Churn MRR"
          value={9_932}
          format="currency"
          change={-3.1}
          icon={<TrendingDown className="h-4 w-4" />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          description="89 churned"
        />
        <StatCard
          title="Paying Customers"
          value={3_842}
          change={3.8}
          icon={<Users className="h-4 w-4" />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          description="ARPA: $33.18"
        />
      </div>

      {/* MRR Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* MRR Trend */}
        <Card className="xl:col-span-3" padding="md">
          <CardHeader>
            <div>
              <CardTitle>MRR Trend</CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">Daily MRR over last 30 days</p>
            </div>
            <div className="flex items-center gap-1">
              {["7D", "30D", "90D", "1Y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setDateRange(p)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    dateRange === p
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTimeSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={6} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* MRR Waterfall */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>MRR Movement</CardTitle>
            <Badge variant="success">+$14,223 net</Badge>
          </CardHeader>
          <div className="space-y-2 mt-2">
            {mrrWaterfall.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-28 text-xs text-neutral-500 text-right flex-shrink-0 truncate">
                  {item.name}
                </div>
                <div className="flex-1 h-7 bg-neutral-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 rounded-lg flex items-center justify-end pr-2"
                    style={{
                      left: item.value < 0 ? "auto" : "0",
                      right: item.value < 0 ? "0" : "auto",
                      width: `${Math.abs(item.value) / 140000 * 100}%`,
                      minWidth: "40%",
                      backgroundColor: item.color,
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-xs font-bold text-white tabular-nums">
                      {item.value > 0 ? "+" : ""}{formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LTV/CAC */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-neutral-500">LTV</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">$1,247</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-neutral-500">LTV/CAC</p>
              <p className="text-lg font-bold text-emerald-600">14.0x</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card padding="none">
        <div className="p-4 border-b border-neutral-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>Transaction Explorer</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="h-8 px-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All types</option>
                <option value="new_subscription">New Subscriptions</option>
                <option value="renewal">Renewals</option>
                <option value="upgrade">Upgrades</option>
                <option value="refund">Refunds</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />}>
                Export CSV
              </Button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">{filteredTx.length} transactions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/50">
                {["Transaction", "Customer", "Type", "Plan", "Amount", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {filteredTx.slice(0, 20).map((tx) => {
                const sc = txStatusConfig[tx.status as keyof typeof txStatusConfig] ?? txStatusConfig.pending;
                return (
                  <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <p className="font-mono text-xs text-neutral-500">{tx.id}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{tx.userName}</p>
                      <p className="text-xs text-neutral-500">{tx.userEmail}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="default">
                        {txTypeConfig[tx.type] ?? tx.type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm capitalize text-neutral-700 dark:text-neutral-300">
                        {tx.plan}
                      </span>
                    </td>
                    <td className="p-3 font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {tx.type === "refund" ? (
                        <span className="text-red-500">-{formatCurrency(tx.amount)}</span>
                      ) : (
                        formatCurrency(tx.amount)
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <sc.icon className={cn("h-3.5 w-3.5", sc.color)} />
                        <Badge variant={sc.badge}>{tx.status}</Badge>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => toast.info("Invoice downloaded")}
                        >
                          Invoice
                        </Button>
                        {tx.status === "success" && tx.type !== "refund" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-red-500"
                            onClick={() => toast.success(`Refund initiated for ${tx.id}`)}
                          >
                            Refund
                          </Button>
                        )}
                        {tx.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-blue-500"
                            onClick={() => toast.success(`Retry initiated for ${tx.id}`)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Failed Payment Recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="md" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Failed Payments
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Failed</span>
                <span className="font-bold text-red-500">$8,450</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "62%" }} />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-neutral-500">
                <span>Recovered: $5,200 (62%)</span>
                <span>Lost: $3,250</span>
              </div>
            </div>

            {mockTransactions
              .filter((t) => t.status === "failed")
              .slice(0, 4)
              .map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-slate-700"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{tx.userName}</p>
                    <p className="text-xs text-neutral-500">{formatCurrency(tx.amount)} · {tx.plan}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => toast.success("Retry initiated")}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { plan: "Free", users: "612K", revenue: "$0", color: "#6b7280" },
              { plan: "Pro", users: "2,290", revenue: "$68,700", color: "#3b82f6" },
              { plan: "Enterprise", users: "145", revenue: "$58,834", color: "#8b5cf6" },
            ].map((p) => (
              <div key={p.plan} className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50 text-center">
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${p.color}20`, color: p.color }}
                >
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-xs text-neutral-500">{p.plan}</p>
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">{p.revenue}</p>
                <p className="text-xs text-neutral-400">{p.users} users</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={[
                { month: "Jan", pro: 52000, enterprise: 42000 },
                { month: "Feb", pro: 56000, enterprise: 45000 },
                { month: "Mar", pro: 59000, enterprise: 48000 },
                { month: "Apr", pro: 62000, enterprise: 51000 },
                { month: "May", pro: 65000, enterprise: 53000 },
                { month: "Jun", pro: 68700, enterprise: 58834 },
              ]}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: unknown) => [formatCurrency(Number(v))]}
              />
              <Bar dataKey="pro" name="Pro" stackId="a" fill="#3b82f6" />
              <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
