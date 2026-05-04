"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  Mail,
  UserX,
  Sparkles,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { useDashboardKpis } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useUsersStore } from "./store/usersStore";
import { useUsersModuleList } from "./hooks/useUsersModule";
import { AdvancedFiltersDrawer } from "./components/AdvancedFiltersDrawer";
import { UsersList } from "./components/UsersList";
import { UserDetailsPanel } from "./components/UserDetails/UserDetailsPanel";
import { UsersWorkspaceHeader } from "./components/UsersWorkspaceHeader";
import { UsersContextRail } from "./components/UsersContextRail";
import { UsersCommandPalette } from "./components/UsersCommandPalette";
import { UsersAnalyticsBoard } from "./components/UsersAnalyticsBoard";
import { UsersGovernanceAndAI } from "./components/UsersGovernanceAndAI";

export default function UsersModule() {
  const { data: kpiData } = useDashboardKpis();
  const { data, isLoading, isError, error, refetch, page, setPage } = useUsersModuleList();
  const filters = useUsersStore((s) => s.filters);
  const setFilters = useUsersStore((s) => s.setFilters);
  const setFiltersOpen = useUsersStore((s) => s.setFiltersOpen);
  const pageSize = useUsersStore((s) => s.pageSize);
  const setPageSize = useUsersStore((s) => s.setPageSize);
  const selectedIds = useUsersStore((s) => s.selectedIds);
  const clearSelection = useUsersStore((s) => s.clearSelection);
  const workspaceTab = useUsersStore((s) => s.workspaceTab);

  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const t = setTimeout(() => setFilters({ search: searchInput }), 300);
    return () => clearTimeout(t);
  }, [searchInput, setFilters]);

  const users = data?.users ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats as Record<string, number> | undefined;
  const kpis = kpiData?.kpis as Record<string, number> | undefined;
  const total = Number(pagination?.total ?? stats?.total_users ?? kpis?.total_users ?? 0);

  const exportUsers = async () => {
    try {
      const blob = await adminApi.users.exportBlob("csv");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export démarré");
    } catch {
      toast.error("Échec export");
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-6rem)] flex-col gap-4 pb-8 xl:flex-row">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -right-20 -top-28 h-[28rem] w-[28rem] rounded-full bg-violet-500/[0.12] blur-[100px] dark:bg-violet-600/[0.08]" />
        <div className="absolute -left-32 top-1/4 h-[22rem] w-[22rem] rounded-full bg-cyan-500/[0.1] blur-[90px] dark:bg-cyan-500/[0.06]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <UsersWorkspaceHeader
          total={total}
          selectedCount={selectedIds.size}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />

        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200/80 bg-red-50/95 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
          >
            <p className="font-medium">Impossible de charger les utilisateurs</p>
            <p className="mt-1 text-xs">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        {workspaceTab === "analytics" ? (
          <UsersAnalyticsBoard />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                title="Total"
                value={kpis?.total_users ?? total}
                icon={<Users className="h-4 w-4" />}
                className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
              />
              <StatCard
                title="Actifs (mois)"
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
                title="Modération"
                value={kpis?.moderation_pending ?? 0}
                icon={<AlertCircle className="h-4 w-4" />}
                iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                className="border border-white/60 bg-white/70 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60"
              />
            </div>

            <UsersGovernanceAndAI />

            <div className="rounded-2xl border border-violet-200/40 bg-violet-50/30 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-950/20">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">Automation & bulk</p>
                <span className="text-xs text-violet-700/80 dark:text-violet-300/90">
                  Workflows : <code className="rounded bg-white/60 px-1 dark:bg-slate-900/60">POST /admin/users/bulk</code>,{" "}
                  <code className="rounded bg-white/60 px-1 dark:bg-slate-900/60">admin_webhooks</code>.
                </span>
              </div>
            </div>

            <Card
              padding="none"
              className="overflow-hidden rounded-2xl border-neutral-200/80 bg-white/80 shadow-xl ring-1 ring-black/[0.04] backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/50 dark:ring-white/[0.06]"
            >
              <div className="border-b border-neutral-200/80 bg-gradient-to-b from-neutral-50/90 to-white/40 px-4 py-4 dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-950/40 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex-1">
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Recherche + opérateurs (email:, plan:, tag:, country:)…"
                      leftIcon={<Search className="h-4 w-4 text-violet-500/80" />}
                      rightIcon={isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-violet-500" /> : undefined}
                      className="h-11 rounded-xl"
                      aria-label="Recherche utilisateurs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filters.plan}
                      onChange={(e) => setFilters({ plan: e.target.value })}
                      className={selectCls}
                      aria-label="Filtrer par plan"
                    >
                      <option value="all">Tous les plans</option>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ status: e.target.value })}
                      className={selectCls}
                      aria-label="Filtrer par statut"
                    >
                      <option value="all">Tous statuts</option>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="banned">Banni</option>
                    </select>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className={selectCls}
                      aria-label="Taille de page"
                    >
                      {[10, 25, 50, 100, 250, 500].map((n) => (
                        <option key={n} value={n}>
                          {n} / page
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl"
                      icon={<Filter className="h-3.5 w-3.5" />}
                      onClick={() => setFiltersOpen(true)}
                    >
                      Filtres avancés
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} aria-label="Actualiser">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="secondary" size="sm" className="rounded-xl" onClick={exportUsers}>
                      CSV rapide
                    </Button>
                  </div>
                </div>

                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200/60 bg-violet-50/90 p-3 dark:border-violet-500/25 dark:bg-violet-950/30"
                  >
                    <span className="text-sm font-medium text-violet-800 dark:text-violet-200">{selectedIds.size} sélectionné(s)</span>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={<Mail className="h-3 w-3" />}
                      onClick={() => toast.info("Bulk email — brancher le fournisseur")}
                    >
                      Email
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      icon={<UserX className="h-3 w-3" />}
                      onClick={() => toast.info("Bulk suspend — utiliser l’API /admin/users/bulk")}
                    >
                      Suspendre
                    </Button>
                    <Button variant="ghost" size="xs" onClick={clearSelection}>
                      Effacer
                    </Button>
                  </motion.div>
                )}

                <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtres rapides">
                  {["active", "inactive", "banned"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilters({ status: st })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        filters.status === st
                          ? "border-violet-500 bg-violet-500/10 text-violet-800 dark:text-violet-200"
                          : "border-neutral-200/80 text-neutral-600 hover:border-violet-300 dark:border-slate-600 dark:text-neutral-400"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <UsersList
                users={users}
                isLoading={isLoading}
                total={total}
                page={page}
                totalPages={Math.max(1, pagination?.total_pages ?? 1)}
                onPageChange={setPage}
              />
            </Card>
          </>
        )}
      </div>

      <UsersContextRail />

      <UsersCommandPalette users={users} />

      <AdvancedFiltersDrawer />
      <UserDetailsPanel />
    </div>
  );
}

const selectCls =
  "h-10 min-w-[8rem] rounded-xl border border-neutral-200/90 bg-white/90 px-3 text-sm font-medium shadow-sm dark:border-slate-600 dark:bg-slate-900/80";
