"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  ArrowUpCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Eye,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatRelativeTime, getPlanColor } from "@/lib/utils";
import {
  useModerationQueue,
  useModerationStats,
  useModerationDecide,
} from "@/hooks/useAdminData";

type ModerationDecision = "approve" | "reject" | "warn" | "ban" | "escalate";

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-bold tabular-nums w-8 text-right", score >= 70 ? "text-red-500" : score >= 40 ? "text-amber-500" : "text-emerald-500")}>
        {score}%
      </span>
      {score >= 70 && <Badge variant="error" size="sm">FLAG</Badge>}
    </div>
  );
}

// Extracted to fix TypeScript narrowing in JSX
function ReviewPanel({
  item,
  currentIdx,
  totalItems,
  isPending,
  onPrev,
  onNext,
  onDecide,
}: {
  item: Record<string, unknown>;
  currentIdx: number;
  totalItems: number;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDecide: (d: ModerationDecision) => void;
}) {
  const scores = (item.ai_scores ?? {}) as Record<string, number>;
  const users = item.users as Record<string, unknown> | undefined;
  const userName = users ? String(users.full_name ?? users.email ?? "") : null;
  const userPlan = users ? String(users.plan ?? "free") : "free";
  const userTokens = users ? Number(users.total_tokens_used ?? 0) : 0;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" disabled={currentIdx === 0} onClick={onPrev} icon={<ChevronLeft className="h-4 w-4" />}>
          Prev
        </Button>
        <span className="text-sm text-neutral-500">Item {currentIdx + 1} of {totalItems}</span>
        <Button variant="ghost" size="sm" disabled={currentIdx >= totalItems - 1} onClick={onNext}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default">{String(item.content_type ?? "text")}</Badge>
          <span className="font-mono text-xs text-neutral-400">{String(item.id ?? "").slice(0, 16)}…</span>
          <span className="ml-auto text-xs text-neutral-400">{formatRelativeTime(String(item.flagged_at ?? ""))}</span>
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
          &ldquo;{String(item.content_preview ?? "No content preview")}&rdquo;
        </p>
        {item.ai_reasoning ? (
          <p className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-200 dark:border-slate-700">
            AI reasoning: {String(item.ai_reasoning)}
          </p>
        ) : null}
      </div>

      {/* AI Analysis */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          AI Safety Scores
          <Badge variant="info">Confidence: {Math.round(Number(item.ai_confidence ?? 0))}%</Badge>
        </h3>
        <div className="space-y-2.5">
          {Object.keys(scores).length > 0 ? (
            Object.entries(scores).map(([cat, score]) => (
              <ScoreBar key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} score={score} />
            ))
          ) : (
            <p className="text-xs text-neutral-400">No AI scores available</p>
          )}
        </div>
      </div>

      {/* User Context */}
      {userName ? (
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">User Context</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{userName}</p>
              <p className="text-xs text-neutral-500">{userTokens.toLocaleString()} tokens used</p>
            </div>
            <Badge className={getPlanColor(userPlan)}>{userPlan}</Badge>
          </div>
        </div>
      ) : null}

      {/* Decision Buttons */}
      <div>
        <p className="text-xs text-neutral-500 mb-2 font-medium">Decision (A/R/W/B/E)</p>
        <div className="grid grid-cols-5 gap-2">
          {(
            [
              { label: "Approve", key: "A", action: "approve" as ModerationDecision, danger: false, icon: CheckCircle2, iconColor: "text-emerald-500" },
              { label: "Reject", key: "R", action: "reject" as ModerationDecision, danger: true, icon: XCircle, iconColor: "text-white" },
              { label: "Warn", key: "W", action: "warn" as ModerationDecision, danger: false, icon: AlertTriangle, iconColor: "text-amber-500" },
              { label: "Ban", key: "B", action: "ban" as ModerationDecision, danger: true, icon: UserX, iconColor: "text-white" },
              { label: "Escalate", key: "E", action: "escalate" as ModerationDecision, danger: false, icon: ArrowUpCircle, iconColor: "text-blue-500" },
            ] as const
          ).map(({ label, key, action, danger, icon: Icon, iconColor }) => (
            <button
              key={action}
              onClick={() => onDecide(action)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                "hover:scale-105 active:scale-95 disabled:opacity-50",
                danger
                  ? "bg-red-600 border-red-700 text-white hover:bg-red-700"
                  : "bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700 hover:border-blue-400"
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
              <span className="text-xs font-medium">{label}</span>
              <kbd className="text-xs bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">{key}</kbd>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModerationPage() {
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [view, setView] = useState<"queue" | "review">("queue");

  const { data: queueData, isLoading, refetch } = useModerationQueue({
    status_filter: filter,
    page,
    page_size: 20,
  });

  const { data: statsData } = useModerationStats();
  const decide = useModerationDecide();

  const items = (queueData?.items ?? []) as Array<Record<string, unknown>>;
  const stats = statsData as Record<string, unknown> | undefined;
  const currentItem = items[currentIdx];

  useEffect(() => {
    if (view !== "review" || !currentItem) return;
    const id = String(currentItem.id ?? "");
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "a") handleDecision("approve");
      if (key === "r") handleDecision("reject");
      if (key === "w") handleDecision("warn");
      if (key === "b") handleDecision("ban");
      if (key === "e") handleDecision("escalate");
      if (key === "arrowleft" && currentIdx > 0) setCurrentIdx((i) => i - 1);
      if (key === "arrowright" && currentIdx < items.length - 1) setCurrentIdx((i) => i + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, currentIdx, currentItem?.id, items.length]);

  const handleDecision = (decision: ModerationDecision) => {
    if (!currentItem) return;
    decide.mutate(
      { itemId: String(currentItem.id ?? ""), decision, reason: `${decision} by admin` },
      {
        onSuccess: () => {
          if (currentIdx >= items.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
          refetch();
        },
      }
    );
  };

  const byStatus = (stats?.by_status as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Queue Depth"
          value={Number(stats?.pending ?? 0)}
          icon={<Shield className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          description="Pending review"
        />
        <StatCard
          title="Approved"
          value={byStatus.approved ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Rejected"
          value={byStatus.rejected ?? 0}
          icon={<XCircle className="h-4 w-4" />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatCard
          title="Avg Review Time"
          value={Math.round(Number(stats?.avg_review_time_seconds ?? 0) / 60)}
          suffix="m"
          icon={<Clock className="h-4 w-4" />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Queue List */}
        <Card padding="none" className="xl:col-span-1">
          <div className="p-4 border-b border-neutral-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <CardTitle>Moderation Queue</CardTitle>
              <div className="flex gap-1">
                <Badge variant="warning">{Number(stats?.pending ?? 0)} pending</Badge>
                <Button variant="ghost" size="xs" onClick={() => refetch()}>
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {["pending", "approved", "rejected", "banned", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); setCurrentIdx(0); }}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                    filter === f
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-neutral-100 dark:border-slate-800">
                  <div className="h-4 bg-neutral-200 dark:bg-slate-700 rounded skeleton mb-2" />
                  <div className="h-3 bg-neutral-100 dark:bg-slate-800 rounded skeleton w-3/4" />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No items in this queue</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const itemScores = (item.ai_scores ?? {}) as Record<string, number>;
                const highScores = Object.entries(itemScores).filter(([, v]) => v >= 40);
                const itemUsers = item.users as Record<string, unknown> | undefined;
                return (
                  <div
                    key={String(item.id)}
                    onClick={() => { setCurrentIdx(idx); setView("review"); }}
                    className={cn(
                      "p-4 cursor-pointer border-b border-neutral-100 dark:border-slate-800 transition-colors",
                      "hover:bg-neutral-50 dark:hover:bg-slate-800/50",
                      idx === currentIdx && view === "review" && "bg-blue-50 dark:bg-blue-900/10 border-l-2 border-l-blue-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-700">
                          {String(item.content_type ?? "text")}
                        </span>
                        <span className="font-mono text-xs text-neutral-400">{String(item.id ?? "").slice(0, 8)}</span>
                      </div>
                      <Badge
                        variant={
                          String(item.status) === "pending" ? "warning"
                            : String(item.status) === "rejected" || String(item.status) === "banned" ? "error"
                            : "success"
                        }
                        size="sm"
                      >
                        {String(item.status ?? "pending")}
                      </Badge>
                    </div>
                    {itemUsers && (
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {String(itemUsers.full_name ?? itemUsers.email ?? "")}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{String(item.content_preview ?? "")}</p>
                    <p className="text-xs text-neutral-400 mt-1">{formatRelativeTime(String(item.flagged_at ?? ""))}</p>
                    {highScores.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {highScores.map(([cat, score]) => (
                          <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            {cat}: {score}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Review Panel */}
        <Card padding="md" className="xl:col-span-2">
          {currentItem && view === "review" ? (
            <ReviewPanel
              item={currentItem}
              currentIdx={currentIdx}
              totalItems={items.length}
              isPending={decide.isPending}
              onPrev={() => setCurrentIdx((i) => i - 1)}
              onNext={() => setCurrentIdx((i) => i + 1)}
              onDecide={handleDecision}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
              <Eye className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select an item from the queue to review</p>
              <p className="text-xs mt-1">
                {Number(stats?.pending ?? 0)} items waiting · Keyboard shortcuts enabled
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
