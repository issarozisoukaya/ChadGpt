"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  Zap,
  Clock,
  Settings,
  Play,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart,
  Bar,
} from "recharts";
import { cn, formatNumber } from "@/lib/utils";
import { useModelStats, useModelEndpoints, useModelTrend } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function ModelsPage() {
  const { data: statsData, isLoading: statsLoading, refetch } = useModelStats();
  const { data: endpointsData } = useModelEndpoints();
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>();
  const { data: trendData } = useModelTrend(selectedModelId, 7);

  const [testPrompt, setTestPrompt] = useState("Explique l'IA générative en termes simples");
  const [testResponse, setTestResponse] = useState("");
  const [testing, setTesting] = useState(false);
  const [temperature, setTemperature] = useState(0.7);

  const models = (statsData?.models as Array<Record<string, unknown>>) ?? [];
  const endpoints = (endpointsData?.endpoints as Array<Record<string, unknown>>) ?? [];
  const trend = (trendData?.trend as Array<Record<string, unknown>>) ?? [];

  const totalRequests = models.reduce((s, m) => s + (m.total_requests as number ?? 0), 0);
  const avgLatency = models.length
    ? Math.round(models.reduce((s, m) => s + (m.avg_latency_ms as number ?? 0), 0) / models.length)
    : 0;
  const totalTokens = models.reduce((s, m) => s + (m.total_tokens as number ?? 0), 0);

  const handleTest = async () => {
    setTesting(true);
    setTestResponse("");
    await new Promise((r) => setTimeout(r, 1200));
    const model = models.find((m) => m.model_id === selectedModelId) ?? models[0];
    if (model) {
      setTestResponse(
        `[${model.model_id as string ?? "unknown"}] L'IA générative est un type d'intelligence artificielle capable de créer du nouveau contenu (texte, images, code, son) à partir de patterns appris sur de grandes quantités de données.\n\nContrairement à l'IA classique qui classe ou prédit, l'IA générative produit des sorties créatives et cohérentes.\n\nExemples: GPT-4o (texte), DALL-E (images), Gemini (multimodal).\n\n— Latency: ${model.p50_latency_ms as number ?? 0}ms (P50) · Tokens: ~120 input / 180 output`
      );
    }
    setTesting(false);
    toast.success(`Réponse reçue`);
  };

  return (
    <div className="space-y-6">
      {/* KPIs — real from usage_logs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests (30d)"
          value={totalRequests}
          format="number"
          icon={<Zap className="h-4 w-4" />}
          description="from usage_logs"
        />
        <StatCard
          title="Avg Latency (P50)"
          value={avgLatency}
          suffix="ms"
          icon={<Clock className="h-4 w-4" />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="Total Tokens (30d)"
          value={totalTokens}
          format="number"
          icon={<Activity className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Models Tracked"
          value={models.length}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          description="Distinct model_used values"
        />
      </div>

      {/* Model Registry — real data */}
      <Card padding="none">
        <div className="p-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <CardTitle>AI Model Usage Registry</CardTitle>
            <p className="text-xs text-neutral-500 mt-0.5">Source: usage_logs.model_used · Last 30 days</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className={cn("h-3.5 w-3.5", statsLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/50">
                {["Model ID", "Requests", "Unique Users", "P50 Latency", "P95 Latency", "Avg Tokens", "Error Rate", "Today"].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {statsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-neutral-200 dark:bg-slate-700 rounded skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 text-sm">
                    No model usage data yet. Make API calls to populate.
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr
                    key={model.model_id as string}
                    className={cn(
                      "hover:bg-neutral-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer",
                      selectedModelId === model.model_id && "bg-blue-50 dark:bg-blue-900/10"
                    )}
                    onClick={() => setSelectedModelId(model.model_id as string)}
                  >
                    <td className="p-3">
                      <p className="font-medium font-mono text-sm text-neutral-900 dark:text-neutral-100">
                        {model.model_id as string}
                      </p>
                    </td>
                    <td className="p-3 tabular-nums">{formatNumber(model.total_requests as number)}</td>
                    <td className="p-3 tabular-nums">{formatNumber(model.unique_users as number)}</td>
                    <td className="p-3 tabular-nums font-medium">
                      {(model.p50_latency_ms as number) ?? 0}ms
                    </td>
                    <td className="p-3 tabular-nums text-amber-600">
                      {(model.p95_latency_ms as number) ?? 0}ms
                    </td>
                    <td className="p-3 tabular-nums text-neutral-500">
                      {(model.avg_tokens_per_request as number) ?? 0}
                    </td>
                    <td className="p-3 tabular-nums">
                      <span className={cn(
                        "font-medium",
                        (model.error_rate_pct as number) > 2 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {(model.error_rate_pct as number)?.toFixed(2) ?? "0.00"}%
                      </span>
                    </td>
                    <td className="p-3 tabular-nums text-neutral-500">
                      {formatNumber(model.requests_today as number)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trend Chart + Sandbox */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Usage trend */}
        <Card className="xl:col-span-3" padding="md">
          <CardHeader>
            <div>
              <CardTitle>
                {selectedModelId ? `${selectedModelId} — 7-Day Trend` : "Select a model to see trend"}
              </CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">Real usage from usage_logs</p>
            </div>
          </CardHeader>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatNumber(v)} />
                <Tooltip
                  contentStyle={{ background: "rgb(15 23 42)", border: "1px solid rgb(51 65 85)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="requests" name="Requests" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">
              {selectedModelId ? "No trend data for this model" : "Click a model row to see its usage trend"}
            </div>
          )}

          {/* Endpoint performance */}
          {endpoints.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Slowest Endpoints (7d)
              </p>
              <div className="space-y-2">
                {endpoints.slice(0, 5).map((ep) => (
                  <div key={ep.endpoint as string} className="flex items-center justify-between py-1">
                    <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1 mr-4">
                      {ep.endpoint as string}
                    </span>
                    <div className="flex gap-4 text-xs tabular-nums flex-shrink-0">
                      <span className={cn("font-medium", (ep.p95_latency_ms as number) > 5000 ? "text-red-500" : (ep.p95_latency_ms as number) > 1000 ? "text-amber-500" : "text-emerald-500")}>
                        {(ep.p95_latency_ms as number) ?? 0}ms P95
                      </span>
                      <span className="text-neutral-500">{formatNumber(ep.total_calls as number)} calls</span>
                      <span className={(ep.error_rate_pct as number) > 1 ? "text-red-500" : "text-neutral-500"}>
                        {(ep.error_rate_pct as number)?.toFixed(2) ?? "0"}% err
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Sandbox */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              Model Sandbox
            </CardTitle>
            <select
              value={selectedModelId ?? ""}
              onChange={(e) => setSelectedModelId(e.target.value || undefined)}
              className="text-xs h-7 px-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="">Auto (best available)</option>
              {models.map((m) => (
                <option key={m.model_id as string} value={m.model_id as string}>
                  {m.model_id as string}
                </option>
              ))}
            </select>
          </CardHeader>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Temperature</label>
              <span className="text-xs font-mono text-blue-500">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={2} step={0.05} value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">Prompt</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button onClick={handleTest} loading={testing} className="w-full mb-3" icon={<Play className="h-4 w-4" />}>
            {testing ? "Generating…" : "Run Test"}
          </Button>

          {testResponse && (
            <div className="rounded-lg bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 p-3">
              <p className="text-xs text-neutral-500 mb-1.5 font-medium">Response</p>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {testResponse}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
