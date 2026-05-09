"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Tabs from "@radix-ui/react-tabs";
import { useUsersStore } from "../store/usersStore";
import { useUserAnalyticsDrawer } from "../hooks/useUsersModule";
import { getUsersDataSource } from "@/lib/users-data-source";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const TAB =
  "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-700 dark:text-neutral-400 dark:hover:bg-slate-800 dark:data-[state=active]:text-violet-300";

export function UserAnalyticsDrawer() {
  const uid = useUsersStore((s) => s.analyticsDrawerUserId);
  const setUid = useUsersStore((s) => s.setAnalyticsDrawerUserId);
  const q = useUserAnalyticsDrawer(uid, 30);

  const close = () => setUid(null);

  if (!uid) return null;

  const source = getUsersDataSource();

  return (
    <AnimatePresence>
      <>
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[58] bg-slate-950/40"
          onClick={close}
        />
        <motion.section
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-0 left-0 right-0 z-[59] max-h-[min(520px,85vh)] overflow-hidden rounded-t-3xl border border-neutral-200/80 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-slate-950"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-analytics-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-600" aria-hidden />
              <h2 id="user-analytics-title" className="text-sm font-semibold">
                Analytics utilisateur
              </h2>
              <span className="font-mono text-xs text-neutral-400">{uid.slice(0, 8)}…</span>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={close} aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {source !== "supabase" ? (
            <div className="p-6 text-sm text-neutral-600 dark:text-neutral-400">
              Les graphiques temps réel depuis <strong>Supabase</strong> sont disponibles lorsque{" "}
              <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">NEXT_PUBLIC_USERS_DATA_SOURCE=supabase</code> et les
              variables Supabase sont configurées.
            </div>
          ) : q.isLoading ? (
            <div className="p-8 text-center text-sm text-neutral-500">Chargement des métriques…</div>
          ) : q.isError ? (
            <div className="p-6 text-sm text-red-600 dark:text-red-400">{(q.error as Error)?.message}</div>
          ) : (
            <Tabs.Root defaultValue="overview" className="flex max-h-[calc(min(520px,85vh)-52px)] flex-col">
              <Tabs.List className="flex shrink-0 gap-1 border-b border-neutral-200/80 px-3 py-2 dark:border-slate-800">
                <Tabs.Trigger value="overview" className={TAB}>
                  Vue d’ensemble
                </Tabs.Trigger>
                <Tabs.Trigger value="features" className={TAB}>
                  Features
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview" className="min-h-0 flex-1 overflow-y-auto p-4 outline-none">
                {(q.data?.series ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-500">
                    Pas encore de lignes dans <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">user_api_usage</code> pour cette période.
                  </p>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={q.data?.series ?? []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-slate-700" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Requêtes" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-2 text-xs text-neutral-500">
                  Source : table <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">user_api_usage</code> (agrégée par jour).
                </p>
              </Tabs.Content>

              <Tabs.Content value="features" className="min-h-0 flex-1 overflow-y-auto p-4 outline-none">
                {Object.keys(q.data?.features_pct ?? {}).length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-500">Aucune répartition par type d’API pour cette fenêtre.</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(q.data?.features_pct ?? {}).map(([name, pct]) => ({
                          name,
                          pct,
                        }))}
                        layout="vertical"
                        margin={{ left: 24 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-slate-700" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="pct" fill="#6366f1" name="% activité" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Tabs.Content>
            </Tabs.Root>
          )}
        </motion.section>
      </>
    </AnimatePresence>
  );
}
