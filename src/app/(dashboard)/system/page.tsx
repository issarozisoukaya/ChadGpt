"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  Zap,
  Mail,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { systemHealth, latencyData, requestsRealtime } from "@/lib/mock-data";
import { toast } from "sonner";

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "API Server": Server,
  "Database (Supabase)": Database,
  "Redis Cache": Zap,
  "WebSocket Server": Activity,
  "Email Service": Mail,
  "Storage (R2)": HardDrive,
  "Celery Workers": RefreshCw,
  "Pinecone Vectors": Database,
};

function StatusDot({ status }: { status: string }) {
  const colors = {
    healthy: "bg-emerald-500",
    degraded: "bg-amber-500 animate-pulse",
    down: "bg-red-500 animate-pulse",
  };
  return <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", colors[status as keyof typeof colors] ?? colors.healthy)} />;
}

export default function SystemPage() {
  const [realtimeData, setRealtimeData] = useState(requestsRealtime.slice(0, 30));

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData((prev) => {
        const next = [...prev.slice(1), {
          time: `${Date.now()}`,
          value: Math.round(800 + Math.random() * 400),
        }];
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = systemHealth.filter((s) => s.status === "healthy").length;
  const degradedCount = systemHealth.filter((s) => s.status === "degraded").length;
  const downCount = systemHealth.filter((s) => s.status === "down").length;

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={cn(
            "rounded-xl p-5 border",
            downCount > 0
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : degradedCount > 0
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
            Overall Status
          </p>
          <p
            className={cn(
              "text-xl font-bold",
              downCount > 0 ? "text-red-600" : degradedCount > 0 ? "text-amber-600" : "text-emerald-600"
            )}
          >
            {downCount > 0 ? "⚠️ Incident" : degradedCount > 0 ? "🟡 Degraded" : "✅ Operational"}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {healthyCount}/{systemHealth.length} services healthy
          </p>
        </div>
        <StatCard title="API Uptime (30d)" value={99.97} format="percent" icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard title="Avg Response Time" value={245} suffix="ms" change={-8.3} icon={<Clock className="h-4 w-4" />} iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard title="Error Rate" value={0.12} format="percent" change={-0.05} icon={<Activity className="h-4 w-4" />} iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      {/* Service Status + Live Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Services */}
        <Card padding="md" className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <Button variant="ghost" size="xs" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => toast.info("Status refreshed")}>
              Refresh
            </Button>
          </CardHeader>
          <div className="space-y-1">
            {systemHealth.map((service) => {
              const Icon = serviceIcons[service.service] ?? Server;
              return (
                <div
                  key={service.service}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={service.status} />
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {service.service}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {service.latency > 0 && (
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          service.latency > 100 ? "text-amber-500 font-medium" : "text-neutral-500"
                        )}
                      >
                        {service.latency}ms
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-neutral-500">{service.uptime}%</span>
                    <Badge
                      variant={
                        service.status === "healthy"
                          ? "success"
                          : service.status === "degraded"
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                    >
                      {service.status === "healthy" ? "Up" : service.status === "degraded" ? "Degraded" : "Down"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Live request chart */}
        <Card padding="md" className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Live Request Rate</CardTitle>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-indicator" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={realtimeData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="value" name="req/s" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSys)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Endpoint performance */}
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Slowest Endpoints (P95)
            </p>
            <div className="space-y-2">
              {[
                { endpoint: "POST /api/v1/chat/message", p95: "1,842ms", rps: "284 req/s", error: "0.12%" },
                { endpoint: "POST /api/v1/image/generate", p95: "15,200ms", rps: "12 req/s", error: "0.21%" },
                { endpoint: "POST /api/v1/voice/synthesize", p95: "3,200ms", rps: "45 req/s", error: "1.8%" },
                { endpoint: "GET /api/v1/auth/me", p95: "125ms", rps: "1,840 req/s", error: "0.02%" },
              ].map((ep) => (
                <div key={ep.endpoint} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1 mr-4">
                    {ep.endpoint}
                  </span>
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs tabular-nums">
                    <span className={cn(
                      "font-medium",
                      parseInt(ep.p95) > 5000 ? "text-red-500" : parseInt(ep.p95) > 1000 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {ep.p95}
                    </span>
                    <span className="text-neutral-500">{ep.rps}</span>
                    <span className={parseFloat(ep.error) > 1 ? "text-red-500" : "text-neutral-500"}>
                      {ep.error}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Latency Heatmap by hour */}
      <Card padding="md">
        <CardHeader>
          <div>
            <CardTitle>Latency Profile (24h)</CardTitle>
            <p className="text-xs text-neutral-500 mt-0.5">P50 / P95 / P99 breakdown by hour</p>
          </div>
        </CardHeader>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latencyData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <Tooltip
              contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: "8px", fontSize: "12px" }}
              formatter={(v: unknown) => [`${v}ms`]}
            />
            <Line type="monotone" dataKey="p50" name="P50" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p95" name="P95" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
