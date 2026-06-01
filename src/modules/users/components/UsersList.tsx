"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  LayoutGrid,
  Table2,
  List,
  Columns3,
  Kanban,
  CalendarClock,
  BarChart3,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Copy,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, getPlanColor, getStatusColor } from "@/lib/utils";
import { useUsersStore, type UsersColumnId, DEFAULT_COLUMN_IDS } from "../store/usersStore";
import { activityTone, flagCountryEmoji, formatRelative, maskEmail } from "../utils/userFormatters";
import { parseEngagementSeries } from "../utils/engagementSeries";
import { UsersAnalyticsBoard } from "./UsersAnalyticsBoard";
import { toast } from "sonner";

type SortField =
  | "email"
  | "plan"
  | "total_tokens_used"
  | "requests_today"
  | "created_at"
  | "risk_score"
  | "last_activity";

interface UsersListProps {
  users: Array<Record<string, unknown>>;
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function MiniSparkline({ points }: { points: number[] | null }) {
  if (!points?.length) {
    return (
      <span className="text-xs text-neutral-400" title="Exécutez sql/migrations/012_seed_engagement_series_from_usage.sql">
        —
      </span>
    );
  }
  const max = Math.max(...points, 1);
  const w = 56;
  const h = 22;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - (p / max) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="text-violet-500" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UsersList({
  users,
  isLoading,
  total,
  page,
  totalPages,
  onPageChange,
}: UsersListProps) {
  const viewMode = useUsersStore((s) => s.viewMode);
  const setViewMode = useUsersStore((s) => s.setViewMode);
  const filters = useUsersStore((s) => s.filters);
  const setFilters = useUsersStore((s) => s.setFilters);
  const selectedIds = useUsersStore((s) => s.selectedIds);
  const toggleSelect = useUsersStore((s) => s.toggleSelect);
  const clearSelection = useUsersStore((s) => s.clearSelection);
  const setDetailUserId = useUsersStore((s) => s.setDetailUserId);
  const setFocusedUserId = useUsersStore((s) => s.setFocusedUserId);
  const columnVisibility = useUsersStore((s) => s.columnVisibility);
  const setColumnVisible = useUsersStore((s) => s.setColumnVisible);
  const resetColumnLayout = useUsersStore((s) => s.resetColumnLayout);
  const pageSizeStore = useUsersStore((s) => s.pageSize);
  const setQuickActionsUserId = useUsersStore((s) => s.setQuickActionsUserId);
  const setAnalyticsDrawerUserId = useUsersStore((s) => s.setAnalyticsDrawerUserId);

  const [revealedEmailIds, setRevealedEmailIds] = useState<Set<string>>(() => new Set());
  const toggleEmailReveal = (id: string) => {
    setRevealedEmailIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = viewMode === "compact" ? 40 : 56;
  const [colMenuOpen, setColMenuOpen] = useState(false);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is intentional for large tables
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 14,
  });

  useEffect(() => {
    if (parentRef.current) parentRef.current.scrollTop = 0;
  }, [page, users, viewMode]);

  const toggleSort = (field: SortField) => {
    if (filters.sort === field) {
      setFilters({ order: filters.order === "asc" ? "desc" : "asc" });
    } else {
      setFilters({ sort: field, order: "desc" });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sort !== field) return <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />;
    return filters.order === "asc" ? (
      <ChevronUp className="h-3 w-3 text-violet-600" aria-hidden />
    ) : (
      <ChevronDown className="h-3 w-3 text-violet-600" aria-hidden />
    );
  };

  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id as string));
  const someSelected = users.some((u) => selectedIds.has(u.id as string)) && !allSelected;

  const visible = (id: UsersColumnId) => columnVisibility[id];

  const headers: { id: UsersColumnId; label: string; sort?: SortField | null }[] = [
    { id: "user", label: "Utilisateur", sort: "email" },
    { id: "email_meta", label: "E-mail", sort: null },
    { id: "plan", label: "Plan", sort: "plan" },
    { id: "status", label: "Statut", sort: null },
    { id: "conversations", label: "Conv.", sort: null },
    { id: "messages", label: "Msg", sort: null },
    { id: "tokens", label: "Tokens", sort: "total_tokens_used" },
    { id: "engagement", label: "Engag.", sort: null },
    { id: "sparkline", label: "7j (logs)", sort: null },
    { id: "geo", label: "Geo", sort: null },
    { id: "created", label: "Inscription", sort: "created_at" },
    { id: "activity", label: "Activité", sort: "last_activity" },
    { id: "actions", label: "", sort: null },
  ];

  const kanbanBuckets = useMemo(() => {
    const m: Record<string, typeof users> = { active: [], inactive: [], suspended: [], banned: [], other: [] };
    for (const u of users) {
      const st = String(u.status || "").toLowerCase();
      if (st === "active") m.active.push(u);
      else if (st === "inactive") m.inactive.push(u);
      else if (st === "suspended") m.suspended.push(u);
      else if (st === "banned") m.banned.push(u);
      else m.other.push(u);
    }
    return m;
  }, [users]);

  const timelineGroups = useMemo(() => {
    const g = new Map<string, typeof users>();
    for (const u of users) {
      const raw = u.created_at ? String(u.created_at) : "";
      const key = raw ? new Date(raw).toLocaleDateString("fr-FR") : "—";
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(u);
    }
    return Array.from(g.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [users]);

  const copyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    toast.success("ID copié");
  };

  if (viewMode === "analytics") {
    return (
      <div className="p-4">
        <UsersAnalyticsBoard />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 px-3 py-2 dark:border-slate-800">
        <p className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {isLoading ? "Chargement…" : `${total.toLocaleString("fr-FR")} utilisateurs`}
        </p>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Mode d’affichage">
          {(
            [
              ["table", Table2, "Tableau"],
              ["compact", List, "Compact"],
              ["cards", LayoutGrid, "Cartes"],
              ["kanban", Kanban, "Kanban"],
              ["timeline", CalendarClock, "Timeline"],
              ["analytics", BarChart3, "Analytics"],
            ] as const
          ).map(([mode, Icon, label]) => (
            <Button
              key={mode}
              type="button"
              variant={viewMode === mode ? "secondary" : "ghost"}
              size="xs"
              className="rounded-lg"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only md:not-sr-only md:ml-1">{label}</span>
            </Button>
          ))}
          <div className="relative">
            <Button type="button" variant="ghost" size="xs" className="rounded-lg" onClick={() => setColMenuOpen(!colMenuOpen)} aria-expanded={colMenuOpen}>
              <Columns3 className="h-3.5 w-3.5" />
              <span className="sr-only md:not-sr-only md:ml-1">Colonnes</span>
            </Button>
            {colMenuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Fermer" onClick={() => setColMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-neutral-200/90 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase text-neutral-400">Visibilité</p>
                  {DEFAULT_COLUMN_IDS.filter((id) => id !== "user" && id !== "actions").map((id) => (
                    <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={columnVisibility[id]}
                        onChange={(e) => setColumnVisible(id, e.target.checked)}
                        className="rounded border-neutral-300 dark:border-slate-600"
                      />
                      {id}
                    </label>
                  ))}
                  <Button variant="ghost" size="xs" className="mt-2 w-full" onClick={resetColumnLayout}>
                    Réinitialiser
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === "cards" && (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-neutral-100 dark:bg-slate-800 skeleton" />
              ))
            : users.map((u) => {
                const id = u.id as string;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFocusedUserId(id)}
                    onDoubleClick={() => setDetailUserId(id)}
                    className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 text-left shadow-sm transition hover:border-violet-300/60 dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white"
                        aria-hidden
                      >
                        {String(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-900 dark:text-white">{String(u.full_name || "—")}</p>
                        <div className="flex min-w-0 items-center gap-1">
                          <p className="truncate text-xs text-neutral-500">
                            {revealedEmailIds.has(id) ? String(u.email || "") : maskEmail(String(u.email || ""))}
                          </p>
                          <button
                            type="button"
                            className="shrink-0 text-[10px] font-medium text-violet-600 hover:underline dark:text-violet-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEmailReveal(id);
                            }}
                          >
                            {revealedEmailIds.has(id) ? (
                              <>
                                <EyeOff className="inline h-3 w-3 align-middle" aria-hidden /> Masquer
                              </>
                            ) : (
                              <>
                                <Eye className="inline h-3 w-3 align-middle" aria-hidden /> Afficher
                              </>
                            )}
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge className={getPlanColor(String(u.plan))}>{String(u.plan)}</Badge>
                          <Badge className={getStatusColor(String(u.status))} size="sm">
                            {String(u.status)}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <MiniSparkline points={parseEngagementSeries(u.engagement_series)} />
                          <span className="text-[10px] text-neutral-400">Double-clic · fiche</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid gap-3 p-4 lg:grid-cols-4">
          {(
            [
              ["active", "Actifs"],
              ["inactive", "Inactifs"],
              ["suspended", "Suspendus"],
              ["banned", "Bannis"],
              ["other", "Autres"],
            ] as const
          ).map(([key, title]) => (
            <div key={key} className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 dark:border-slate-800 dark:bg-slate-900/30">
              <p className="border-b border-neutral-200/80 px-3 py-2 text-xs font-semibold dark:border-slate-800">
                {title} · {kanbanBuckets[key].length}
              </p>
              <ul className="max-h-[480px] space-y-2 overflow-y-auto p-2">
                {kanbanBuckets[key].map((u) => {
                  const id = u.id as string;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setFocusedUserId(id)}
                        onDoubleClick={() => setDetailUserId(id)}
                        className="w-full rounded-xl border border-neutral-200/80 bg-white/90 p-2 text-left text-xs shadow-sm dark:border-slate-700 dark:bg-slate-950/60"
                      >
                        <p className="truncate font-medium">{String(u.full_name || u.email)}</p>
                        <p className="truncate text-neutral-500">{String(u.email)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {viewMode === "timeline" && (
        <div className="space-y-4 p-4">
          {timelineGroups.map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">{day}</p>
              <ul className="space-y-2 border-l-2 border-violet-200/80 pl-4 dark:border-violet-900/50">
                {list.map((u) => {
                  const id = u.id as string;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white/80 px-3 py-2 text-left text-sm dark:border-slate-700 dark:bg-slate-900/50"
                        onClick={() => setFocusedUserId(id)}
                        onDoubleClick={() => setDetailUserId(id)}
                      >
                        <span className="truncate font-medium">{String(u.full_name || u.email)}</span>
                        <Badge className={getPlanColor(String(u.plan))} size="sm">
                          {String(u.plan)}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(viewMode === "table" || viewMode === "compact") && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200/90 bg-white/70 dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="sticky left-0 z-20 w-10 bg-white/95 p-2 text-left backdrop-blur dark:bg-slate-900/95">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 dark:border-slate-600"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={() => {
                        if (allSelected) clearSelection();
                        else users.forEach((u) => !selectedIds.has(u.id as string) && toggleSelect(u.id as string));
                      }}
                      aria-label="Sélectionner la page"
                    />
                  </th>
                  {headers
                    .filter((h) => visible(h.id))
                    .map((h) => (
                      <th
                        key={h.id}
                        className={cn(
                          "whitespace-nowrap p-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400",
                          h.id === "user" && "sticky left-10 z-20 min-w-[200px] bg-white/95 backdrop-blur dark:bg-slate-900/95",
                          h.id === "actions" && "sticky right-0 z-20 bg-white/95 backdrop-blur dark:bg-slate-900/95"
                        )}
                      >
                        {h.sort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md py-0.5 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                            onClick={() => toggleSort(h.sort!)}
                          >
                            {h.label}
                            <SortIcon field={h.sort} />
                          </button>
                        ) : (
                          h.label
                        )}
                      </th>
                    ))}
                </tr>
              </thead>
            </table>
          </div>

          <div ref={parentRef} className="max-h-[min(70vh,560px)] overflow-auto" role="rowgroup">
            <table className="w-full min-w-[1040px] text-sm">
              <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={14} className="p-2">
                          <div className="h-10 rounded-lg bg-neutral-100 dark:bg-slate-800 skeleton" />
                        </td>
                      </tr>
                    ))
                  : users.length === 0
                    ? (
                        <tr>
                          <td colSpan={14} className="p-8 text-center text-neutral-500">
                            Aucun utilisateur pour ces filtres.
                          </td>
                        </tr>
                      )
                    : (
                        <>
                          {virtualizer.getVirtualItems().map((v) => {
                            const u = users[v.index];
                            const id = u.id as string;
                            const cc = (u.country_code as string) || "";
                            const quota = Number(u.token_quota ?? 500_000);
                            const tokens = Number(u.total_tokens_used ?? 0);
                            const pct = Math.min(100, (tokens / Math.max(1, quota)) * 100);
                            const verified = Boolean(u.email_verified ?? u.emailVerified);
                            return (
                              <tr
                                key={id}
                                data-index={v.index}
                                ref={virtualizer.measureElement}
                                onClick={() => setFocusedUserId(id)}
                                onDoubleClick={() => setDetailUserId(id)}
                                className={cn(
                                  "cursor-pointer hover:bg-violet-500/[0.04] dark:hover:bg-violet-400/[0.06]",
                                  selectedIds.has(id) && "bg-violet-500/10"
                                )}
                              >
                                <td className="sticky left-0 z-10 w-10 bg-white/90 p-2 backdrop-blur dark:bg-slate-950/90" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="rounded border-neutral-300 dark:border-slate-600"
                                    checked={selectedIds.has(id)}
                                    onChange={() => toggleSelect(id)}
                                    aria-label={`Sélectionner ${String(u.full_name || u.email)}`}
                                  />
                                </td>
                                {visible("user") && (
                                  <td
                                    className={cn(
                                      "sticky left-10 z-10 min-w-[200px] bg-white/90 p-2 backdrop-blur dark:bg-slate-950/90",
                                      viewMode === "compact" && "py-1.5"
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white"
                                        aria-hidden
                                      >
                                        {String(u.full_name || u.email || "?")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                      <span className="min-w-0">
                                        <span className="block truncate font-medium text-neutral-900 dark:text-white">{String(u.full_name || "—")}</span>
                                        <span className="flex min-w-0 items-center gap-1">
                                          <span className="block truncate text-xs text-neutral-500">
                                            {revealedEmailIds.has(id)
                                              ? String(u.email || "")
                                              : maskEmail(String(u.email || ""))}
                                          </span>
                                          <button
                                            type="button"
                                            className="shrink-0 text-[10px] font-medium text-violet-600 hover:underline dark:text-violet-400"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleEmailReveal(id);
                                            }}
                                          >
                                            {revealedEmailIds.has(id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                          </button>
                                        </span>
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visible("email_meta") && (
                                  <td className={cn("p-2", viewMode === "compact" && "py-1.5")}>
                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
                                      {verified ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-label="E-mail vérifié" />
                                      ) : (
                                        <Circle className="h-3.5 w-3.5 text-neutral-400" aria-label="Non vérifié" />
                                      )}
                                      {verified ? "Vérifié" : "—"}
                                    </span>
                                  </td>
                                )}
                                {visible("plan") && (
                                  <td className={cn("p-2", viewMode === "compact" && "py-1.5")}>
                                    <Badge className={getPlanColor(String(u.plan))}>{String(u.plan)}</Badge>
                                  </td>
                                )}
                                {visible("status") && (
                                  <td className={cn("p-2", viewMode === "compact" && "py-1.5")}>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className={cn("h-2 w-2 rounded-full", String(u.status) === "active" ? "bg-emerald-500" : "bg-neutral-400")} aria-hidden />
                                      <Badge className={getStatusColor(String(u.status))} size="sm">
                                        {String(u.status)}
                                      </Badge>
                                    </span>
                                  </td>
                                )}
                                {visible("conversations") && (
                                  <td className={cn("p-2 tabular-nums text-neutral-600", viewMode === "compact" && "py-1.5")}>
                                    {formatNumber(Number(u.total_sessions ?? u.conversation_count ?? 0))}
                                  </td>
                                )}
                                {visible("messages") && (
                                  <td className={cn("p-2 tabular-nums text-neutral-600", viewMode === "compact" && "py-1.5")}>
                                    {formatNumber(Number(u.total_messages ?? 0))}
                                  </td>
                                )}
                                {visible("tokens") && (
                                  <td className={cn("min-w-[120px] p-2", viewMode === "compact" && "py-1.5")}>
                                    <div className="tabular-nums text-xs text-neutral-700 dark:text-neutral-300">{formatNumber(tokens)}</div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-slate-700" title={`Quota ${formatNumber(quota)}`}>
                                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                  </td>
                                )}
                                {visible("engagement") && (
                                  <td className={cn("p-2 tabular-nums text-neutral-600", viewMode === "compact" && "py-1.5")}>
                                    {u.engagement_score != null
                                      ? `${Math.min(100, Number(u.engagement_score))}%`
                                      : "—"}
                                  </td>
                                )}
                                {visible("sparkline") && (
                                  <td className={cn("p-2", viewMode === "compact" && "py-1.5")}>
                                    <MiniSparkline points={parseEngagementSeries(u.engagement_series)} />
                                  </td>
                                )}
                                {visible("geo") && (
                                  <td className={cn("p-2 text-xs text-neutral-600 dark:text-neutral-300", viewMode === "compact" && "py-1.5")}>
                                    <span aria-hidden>{flagCountryEmoji(cc)}</span> {cc || "—"}{" "}
                                    <span className="text-neutral-400">{String(u.language ?? "")}</span>
                                  </td>
                                )}
                                {visible("created") && (
                                  <td className={cn("p-2 whitespace-nowrap text-xs text-neutral-500", viewMode === "compact" && "py-1.5")} title={u.created_at ? String(u.created_at) : undefined}>
                                    {u.created_at ? formatRelative(u.created_at as string) : "—"}
                                  </td>
                                )}
                                {visible("activity") && (
                                  <td className={cn("p-2 text-xs", activityTone(u.last_seen_at as string), viewMode === "compact" && "py-1.5")}>
                                    {formatRelative(u.last_seen_at as string)}
                                  </td>
                                )}
                                {visible("actions") && (
                                  <td
                                    className="sticky right-0 z-10 bg-white/90 p-2 backdrop-blur dark:bg-slate-950/90"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-end gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        className="h-8 w-8 rounded-lg p-0"
                                        title="Actions rapides"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setQuickActionsUserId(id);
                                        }}
                                      >
                                        <Zap className="h-4 w-4 text-amber-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        className="h-8 w-8 rounded-lg p-0"
                                        title="Analytics"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAnalyticsDrawerUserId(id);
                                        }}
                                      >
                                        <BarChart3 className="h-4 w-4 text-violet-500" />
                                      </Button>
                                      <Button variant="ghost" size="xs" className="h-8 w-8 rounded-lg p-0" onClick={() => setDetailUserId(id)} title="Fiche">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="xs" className="h-8 w-8 rounded-lg p-0" onClick={() => copyId(id)} title="Copier ID">
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </>
                      )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!["cards", "kanban", "timeline", "analytics"].includes(viewMode) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/80 px-3 py-3 dark:border-slate-800">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Précédent
          </Button>
          <span className="text-xs text-neutral-500">
            {total > 0 ? (
              <>
                {(page - 1) * pageSizeStore + 1}–{Math.min((page - 1) * pageSizeStore + users.length, total)} sur{" "}
                {total.toLocaleString("fr-FR")} · page {page}/{Math.max(1, totalPages)}
              </>
            ) : (
              <>Page {page}</>
            )}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
