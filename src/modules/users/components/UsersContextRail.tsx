"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Mail,
  Shield,
  ExternalLink,
  Copy,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, getPlanColor, getStatusColor } from "@/lib/utils";
import { useUsersStore } from "../store/usersStore";
import { useUserDetail360 } from "../hooks/useUsersModule";
import { formatRelative, flagCountryEmoji } from "../utils/userFormatters";
import { toast } from "sonner";

export function UsersContextRail() {
  const collapsed = useUsersStore((s) => s.contextRailCollapsed);
  const toggleContextRail = useUsersStore((s) => s.toggleContextRail);
  const focusedUserId = useUsersStore((s) => s.focusedUserId);
  const setDetailUserId = useUsersStore((s) => s.setDetailUserId);

  const { data, isLoading } = useUserDetail360(focusedUserId);

  const user = (data?.user ?? {}) as Record<string, unknown>;
  const predictions = (data?.predictions ?? {}) as Record<string, unknown>;

  const copyId = () => {
    const id = user.id as string;
    if (id) {
      void navigator.clipboard.writeText(id);
      toast.success("ID copié");
    }
  };

  return (
    <AnimatePresence mode="popLayout">
      {!collapsed && (
        <motion.aside
          key="rail"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 32, stiffness: 380 }}
          className="sticky top-20 hidden h-[calc(100vh-6rem)] shrink-0 overflow-hidden lg:block"
        >
          <div
            className={cn(
              "flex h-full w-[360px] flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/75 shadow-xl backdrop-blur-xl",
              "dark:border-slate-700/80 dark:bg-slate-950/70"
            )}
          >
            <div className="flex items-center justify-between border-b border-neutral-200/80 px-3 py-2 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Contexte</p>
              <Button variant="ghost" size="xs" className="h-7 rounded-lg px-2" onClick={toggleContextRail} aria-label="Replier le panneau">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {!focusedUserId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-neutral-500">
                <Activity className="h-8 w-8 opacity-40" />
                Sélectionnez une ligne pour afficher l’aperçu, les insights et les actions rapides.
              </div>
            ) : isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-neutral-100 dark:bg-slate-800 skeleton" />
                ))}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="border-b border-neutral-200/80 bg-gradient-to-b from-violet-500/10 to-transparent p-4 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white"
                      aria-hidden
                    >
                      {String(user.full_name || user.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-neutral-900 dark:text-white">{String(user.full_name || "—")}</p>
                      <p className="truncate text-xs text-neutral-500">{String(user.email || "")}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge className={getPlanColor(String(user.plan))}>{String(user.plan)}</Badge>
                        <Badge className={getStatusColor(String(user.status))} size="sm">
                          {String(user.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" size="xs" icon={<ExternalLink className="h-3 w-3" />} onClick={() => setDetailUserId(focusedUserId)}>
                      Fiche complète
                    </Button>
                    <Button variant="ghost" size="xs" icon={<Copy className="h-3 w-3" />} onClick={copyId}>
                      ID
                    </Button>
                    <Button variant="ghost" size="xs" icon={<Mail className="h-3 w-3" />} onClick={() => toast.info("Canal email à brancher")}>
                      Message
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 p-4 text-sm">
                  <div className="rounded-xl border border-neutral-200/70 bg-white/50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Aperçu</p>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-neutral-500">Pays</dt>
                        <dd>
                          <span aria-hidden>{flagCountryEmoji(user.country_code as string)}</span> {String(user.country_code || "—")}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-neutral-500">Dernière activité</dt>
                        <dd className="text-right">{formatRelative(user.last_seen_at as string)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-neutral-500">Tokens</dt>
                        <dd className="tabular-nums">{formatNumber(Number(user.total_tokens_used ?? 0))}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-violet-200/50 bg-violet-50/40 p-3 dark:border-violet-500/20 dark:bg-violet-950/20">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      <Sparkles className="h-3.5 w-3.5" /> Insights IA
                    </p>
                    <ul className="mt-2 space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                      <li>
                        Santé compte : <strong>{String(predictions.health_label ?? "—")}</strong>
                      </li>
                      <li>
                        Risque churn : <strong>{Number(predictions.churn_risk ?? 0)}</strong>/100 (voir{" "}
                        <code className="text-[10px]">user_ml_profiles</code> / tâche batch).
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-200/70 p-3 dark:border-slate-700">
                    <p className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                      <Shield className="h-3.5 w-3.5" /> Audit rapide
                    </p>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                      Les événements détaillés sont dans l’onglet « Sécurité & audit » de la fiche utilisateur.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
      {collapsed && (
        <motion.button
          key="peek"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sticky top-24 hidden h-10 w-8 shrink-0 items-center justify-center rounded-l-xl border border-r-0 border-neutral-200/80 bg-white/90 shadow-md dark:border-slate-700 dark:bg-slate-900 lg:flex"
          onClick={toggleContextRail}
          aria-label="Ouvrir le panneau contexte"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-500" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
