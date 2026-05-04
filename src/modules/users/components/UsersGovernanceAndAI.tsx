"use client";

import { useMemo, useState } from "react";
import { Database, Bot, Search, MessageCircleQuestion, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminSettings } from "@/hooks/useAdminData";
import { useUsersStore, type UsersListFilters } from "../store/usersStore";
import { nlQueryToFilters } from "../utils/nlSearchHeuristic";
import { adminApi } from "@/lib/api/client";
import { toast } from "sonner";

function parseSettingsJson(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      const o = JSON.parse(v) as unknown;
      if (o && typeof o === "object" && !Array.isArray(o)) return o as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function UsersGovernanceAndAI() {
  const { data, isLoading } = useAdminSettings();
  const setFilters = useUsersStore((s) => s.setFilters);
  const filters = useUsersStore((s) => s.filters);
  const [nlQuery, setNlQuery] = useState("");
  const [nlBusy, setNlBusy] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantLog, setAssistantLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const retention = useMemo(() => {
    const rows = data?.settings ?? [];
    const row = rows.find((r: { key?: string }) => r.key === "data_retention_policy");
    return parseSettingsJson(row?.value);
  }, [data]);

  const aiFlags = useMemo(() => {
    const rows = data?.settings ?? [];
    const row = rows.find((r: { key?: string }) => r.key === "ai_admin_features");
    return parseSettingsJson(row?.value);
  }, [data]);

  const applyNl = async () => {
    const q = nlQuery.trim();
    if (!q) return;
    setNlBusy(true);
    try {
      const res = await adminApi.users.nlSearch({
        query: q,
        search: filters.search || undefined,
        plan: filters.plan !== "all" ? filters.plan : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        country_code: filters.country_code || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        tags: filters.tags || undefined,
      });
      const eff = res.effective_filters as Partial<UsersListFilters>;
      const merged: Partial<UsersListFilters> = {};
      if (eff.search != null) merged.search = String(eff.search);
      if (eff.plan != null) merged.plan = String(eff.plan);
      if (eff.status != null) merged.status = String(eff.status);
      if (eff.country_code != null) merged.country_code = String(eff.country_code);
      if (eff.date_from != null) merged.date_from = String(eff.date_from);
      if (eff.date_to != null) merged.date_to = String(eff.date_to);
      if (eff.tags != null) merged.tags = String(eff.tags);
      setFilters(merged);
      toast.success(`${res.result_count.toLocaleString("fr-FR")} utilisateur(s) · ${res.latency_ms} ms`, {
        description: res.notes ? String(res.notes) : `Filtres : ${JSON.stringify(res.parsed_filters)}`,
      });
      setNlQuery("");
    } catch (e) {
      const fallback = nlQueryToFilters(q);
      if (fallback && Object.keys(fallback).length) {
        setFilters(fallback);
        toast.message("API NL indisponible — heuristique locale appliquée", {
          description: (e as Error).message,
        });
        setNlQuery("");
      } else {
        toast.error((e as Error).message || "Échec recherche NL");
      }
    } finally {
      setNlBusy(false);
    }
  };

  const askAssistant = async () => {
    const q = assistantInput.trim();
    if (!q) return;
    setAssistantLog((prev) => [...prev, { role: "user", text: q }]);
    setAssistantInput("");
    setAssistantBusy(true);
    try {
      const r = await adminApi.assistant.chat(q);
      const extra = r.sources?.length ? `\n\nSources : ${r.sources.join(", ")}` : "";
      setAssistantLog((prev) => [...prev, { role: "assistant", text: `${r.reply}${extra}` }]);
    } catch (e) {
      setAssistantLog((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Erreur API assistant : ${(e as Error).message}. Vérifiez POST /admin/assistant/chat.`,
        },
      ]);
    } finally {
      setAssistantBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Shield className="h-4 w-4 text-violet-500" />
          Conservation des données & RGPD
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Paramètres : clé <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">data_retention_policy</code> (migration 011). Tables :{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">user_gdpr_retention</code>,{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">admin_audit_log</code>.
        </p>
        {isLoading ? (
          <p className="mt-3 text-sm text-neutral-500">Chargement des paramètres…</p>
        ) : retention ? (
          <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <span className="text-neutral-500">Logs bruts (jours) :</span>{" "}
              <strong>{String(retention.raw_usage_logs_days ?? "—")}</strong>
            </li>
            <li>
              <span className="text-neutral-500">Archivage inactifs après (j) :</span>{" "}
              <strong>{String(retention.archive_inactive_after_days ?? "—")}</strong>
            </li>
            <li>
              <span className="text-neutral-500">Anonymisation post-archivage (j) :</span>{" "}
              <strong>{String(retention.anonymize_after_archive_days ?? "—")}</strong>
            </li>
            <li>
              <span className="text-neutral-500">Purge planifiée (cron) :</span>{" "}
              <strong className="font-mono text-xs">{String(retention.scheduled_purge_cron ?? "—")}</strong>
            </li>
            <li>
              <span className="text-neutral-500">Anonymisation auto :</span>{" "}
              <strong>{String(retention.gdpr_auto_anonymize_enabled ?? false)}</strong>
            </li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Exécutez <code className="text-xs">011_retention_ai_enriched_view.sql</code> pour créer la politique dans{" "}
            <code className="text-xs">admin_settings</code>.
          </p>
        )}
      </Card>

      <Card className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Database className="h-4 w-4 text-cyan-500" />
          Recherche augmentée (NL)
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">POST /admin/users/nl-search</code> · journal{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">admin_nl_search_log</code>.
        </p>
        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          NL activé (config) : <strong>{String(aiFlags?.nl_search_enabled ?? false)}</strong> · Insights :{" "}
          <strong>{String(aiFlags?.insight_detection_enabled ?? false)}</strong>
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder='Ex. « utilisateurs inactifs depuis 2 semaines », « enterprise France »'
            className="rounded-xl text-sm"
            aria-label="Recherche en langage naturel"
            onKeyDown={(e) => e.key === "Enter" && !nlBusy && applyNl()}
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0 rounded-xl"
            loading={nlBusy}
            icon={<Search className="h-3.5 w-3.5" />}
            onClick={() => void applyNl()}
          >
            Appliquer
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          Les filtres actuels de la grille sont fusionnés avec l’interprétation NL. Fallback local si l’API échoue.
        </p>
      </Card>

      <Card className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/50 lg:col-span-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Bot className="h-4 w-4 text-violet-500" />
          Assistant admin
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">POST /admin/assistant/chat</code> · KPIs via{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">fn_dashboard_kpis</code> · activé (config) :{" "}
          <strong>{String(aiFlags?.assistant_enabled ?? false)}</strong>
        </p>
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
          {assistantLog.length === 0 ? (
            <p className="text-neutral-500">Posez une question sur les métriques, exports ou procédures de modération.</p>
          ) : (
            assistantLog.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-violet-500/10 px-3 py-2 text-neutral-800 dark:text-neutral-200"
                    : "mr-8 rounded-lg border border-neutral-200/80 bg-white/80 px-3 py-2 text-neutral-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-neutral-300"
                }
              >
                <span className="text-[10px] font-semibold uppercase text-neutral-400">{m.role}</span>
                <p className="mt-0.5 whitespace-pre-wrap">{m.text}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
            placeholder="Ex. Combien d’utilisateurs actifs ? Comment exporter les VIP ?"
            className="rounded-xl text-sm"
            onKeyDown={(e) => e.key === "Enter" && !assistantBusy && void askAssistant()}
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0 rounded-xl"
            loading={assistantBusy}
            icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}
            onClick={() => void askAssistant()}
          >
            Envoyer
          </Button>
        </div>
      </Card>
    </div>
  );
}
