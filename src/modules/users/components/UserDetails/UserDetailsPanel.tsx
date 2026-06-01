"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Shield,
  CreditCard,
  Lock,
  StickyNote,
  LineChart,
  Tag,
  MessageSquare,
  AlertTriangle,
  Copy,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn, formatNumber, getPlanColor, getStatusColor } from "@/lib/utils";
import { useUsersStore } from "../../store/usersStore";
import { formatRelative, flagCountryEmoji, maskEmail, maskPhone } from "../../utils/userFormatters";
import {
  useUserDetail360,
  useUserActivity,
  useUserTagMutations,
  useUserNoteMutation,
} from "../../hooks/useUsersModule";
import { adminApi } from "@/lib/api/client";
import { supabaseAdminUsers } from "@/lib/api/supabase-admin-users";
import { getUsersDataSource } from "@/lib/users-data-source";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConversations } from "@/hooks/useAdminData";

const TAB_LIST =
  "flex flex-wrap gap-1 border-b border-neutral-200/80 px-3 py-2 dark:border-slate-800 overflow-x-auto";

const TAB_TRIGGER =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-700 dark:text-neutral-400 dark:hover:bg-slate-800 dark:data-[state=active]:text-violet-300";

export function UserDetailsPanel() {
  const detailUserId = useUsersStore((s) => s.detailUserId);
  const setDetailUserId = useUsersStore((s) => s.setDetailUserId);
  const { data, isLoading } = useUserDetail360(detailUserId);
  const activityQ = useUserActivity(detailUserId);
  const tagMut = useUserTagMutations(detailUserId);
  const noteMut = useUserNoteMutation(detailUserId);
  const convQ = useConversations({
    user_id: detailUserId ?? undefined,
    page: 1,
    page_size: 50,
    enabled: !!detailUserId && getUsersDataSource() !== "supabase",
  });
  const qc = useQueryClient();
  const [noteDraft, setNoteDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [dangerReason, setDangerReason] = useState("");
  const [dangerConfirm, setDangerConfirm] = useState("");
  const [piiReveal, setPiiReveal] = useState(false);

  const isSupabase = getUsersDataSource() === "supabase";

  const invalidateUser = () => {
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["user", "360", detailUserId] });
  };

  const suspendMut = useMutation({
    mutationFn: () =>
      isSupabase
        ? supabaseAdminUsers.ban(detailUserId!, dangerReason)
        : adminApi.users.ban(detailUserId!, dangerReason, "permanent", "suspended"),
    onSuccess: () => {
      invalidateUser();
      toast.success("Compte suspendu · l’app mobile sera bloquée sous ~30 s");
      setDangerReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banMut = useMutation({
    mutationFn: () =>
      isSupabase
        ? supabaseAdminUsers.ban(detailUserId!, dangerReason)
        : adminApi.users.ban(detailUserId!, dangerReason, "permanent", "banned"),
    onSuccess: () => {
      invalidateUser();
      toast.success("Compte banni · notification push envoyée si FCM actif");
      setDangerReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivateMut = useMutation({
    mutationFn: () =>
      isSupabase
        ? adminApi.users.setStatus(detailUserId!, "active", dangerReason || undefined)
        : adminApi.users.reactivate(detailUserId!, dangerReason || undefined),
    onSuccess: () => {
      invalidateUser();
      toast.success("Compte réactivé · accès mobile restauré");
      setDangerReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () =>
      getUsersDataSource() === "supabase"
        ? supabaseAdminUsers.deleteData(detailUserId!)
        : adminApi.users.deleteData(detailUserId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDetailUserId(null);
      toast.success("Données supprimées (RGPD) · journalisé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!detailUserId) return null;

  const user = (data?.user ?? {}) as Record<string, unknown>;
  const predictions = (data?.predictions ?? {}) as Record<string, unknown>;
  const scores = (data?.scores ?? {}) as Record<string, unknown>;
  const tags = (data?.tags ?? []) as Array<{ tag: string }>;
  const notes = (data?.admin_notes ?? []) as Array<Record<string, unknown>>;

  const accountStatus = String(user.status ?? "active").toLowerCase();
  const isBlocked = accountStatus === "suspended" || accountStatus === "banned";
  const statusReason = user.status_reason as string | undefined;

  const copyId = () => {
    const id = user.id as string;
    if (id) {
      void navigator.clipboard.writeText(id);
      toast.success("ID copié");
    }
  };

  const requireReason = () => {
    if (!dangerReason.trim()) {
      toast.error("La raison est obligatoire pour l’audit.");
      return false;
    }
    return true;
  };
  const onDelete = () => {
    if (dangerConfirm !== "SUPPRIMER") {
      toast.error('Tapez exactement « SUPPRIMER » pour confirmer.');
      return;
    }
    if (!dangerReason.trim()) {
      toast.error("Indiquez la raison légale / ticket associé.");
      return;
    }
    delMut.mutate();
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px]"
          onClick={() => setDetailUserId(null)}
        />
        <motion.aside
          key={detailUserId ?? "closed"}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[min(100vw-0.5rem,42rem)] flex-col overflow-hidden border-l border-neutral-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="shrink-0 border-b border-neutral-200/80 bg-gradient-to-br from-violet-500/10 to-transparent px-4 py-3 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white"
                  aria-hidden
                >
                  {String(user.full_name || user.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 id="user-details-title" className="truncate text-lg font-semibold text-neutral-900 dark:text-white">
                    {isLoading ? "…" : String(user.full_name || "Utilisateur")}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-neutral-500">
                      {piiReveal ? String(user.email || "") : maskEmail(String(user.email || ""))}
                    </p>
                    <Button variant="ghost" size="xs" className="h-7 shrink-0 px-2 text-[11px]" onClick={() => setPiiReveal((v) => !v)}>
                      {piiReveal ? "Masquer" : "Révéler"}
                    </Button>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span aria-hidden>{flagCountryEmoji(user.country_code as string)}</span>
                    {String(user.country_code || "—")} ·{" "}
                    <button type="button" className="font-mono hover:text-violet-600" title="Copier UUID" onClick={copyId}>
                      {String(user.id || "").slice(0, 8)}…
                    </button>
                    <Badge className={getPlanColor(String(user.plan))}>{String(user.plan)}</Badge>
                    <Badge className={getStatusColor(String(user.status))}>{String(user.status)}</Badge>
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 rounded-full" onClick={() => setDetailUserId(null)} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="xs" icon={<Mail className="h-3 w-3" />} onClick={() => toast.info("Canal messagerie admin à brancher")}>
                Contacter
              </Button>
              <Button variant="secondary" size="xs" icon={<Copy className="h-3 w-3" />} onClick={copyId}>
                Copier ID
              </Button>
              <Button variant="secondary" size="xs" onClick={() => toast.info("Impersonation · journaliser via /admin/users/:id/actions")}>
                Impersonate
              </Button>
            </div>
          </header>

          <Tabs.Root defaultValue="general" className="flex min-h-0 flex-1 flex-col">
            <Tabs.List className={TAB_LIST} aria-label="Sections utilisateur">
              {(
                [
                  ["general", "Général", User],
                  ["conversations", "Conversations", MessageSquare],
                  ["security", "Sécurité & audit", Lock],
                  ["analytics", "Analytics", LineChart],
                  ["notes_tags", "Notes & tags", StickyNote],
                  ["danger", "Danger", AlertTriangle],
                ] as const
              ).map(([id, label, Icon]: readonly [string, string, LucideIcon]) => (
                <Tabs.Trigger key={id} value={id} className={TAB_TRIGGER}>
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <Tabs.Content value="general" className="p-4 outline-none">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-slate-800 skeleton" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPlanColor(String(user.plan))}>{String(user.plan)}</Badge>
                      <Badge className={getStatusColor(String(user.status))}>{String(user.status)}</Badge>
                    </div>
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Profil & compte</p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-neutral-500">Inscription</dt>
                          <dd className="font-medium">{user.created_at ? formatRelative(user.created_at as string) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Dernière activité</dt>
                          <dd className="font-medium">{formatRelative(user.last_seen_at as string)}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Méthode</dt>
                          <dd>{String(user.auth_provider ?? "email")}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Langue</dt>
                          <dd>{String(user.preferred_language ?? user.locale ?? "—")}</dd>
                        </div>
                      </dl>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Usage</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-neutral-500">Tokens</span>
                          <p className="font-semibold tabular-nums">{formatNumber(Number(user.total_tokens_used ?? 0))}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Sessions</span>
                          <p className="font-semibold tabular-nums">{formatNumber(Number(user.total_sessions ?? 0))}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Messages</span>
                          <p className="font-semibold tabular-nums">{formatNumber(Number(user.total_messages ?? 0))}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Risque (score)</span>
                          <p className="font-semibold tabular-nums">{Number(user.risk_score ?? 0)}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <CreditCard className="h-3.5 w-3.5" /> Abonnement & facturation
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                        <p>
                          Téléphone :{" "}
                          <strong>{piiReveal ? String(user.phone ?? "—") : maskPhone(String(user.phone ?? ""))}</strong>
                        </p>
                        <p className="text-xs text-neutral-500">
                          Revenus / abonnement : utilisez les colonnes <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">subscription_*</code>,{" "}
                          <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">user_payments</code> lorsque le schéma Supabase est présent.
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="conversations" className="p-4 outline-none">
                {getUsersDataSource() === "supabase" ? (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Fil des conversations non branché sur Supabase dans ce module : utilisez l’API REST (
                    <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-slate-800">/admin/conversations</code>) ou ajoutez une vue dédiée.
                  </p>
                ) : convQ.isLoading ? (
                  <p className="text-sm text-neutral-500">Chargement des conversations…</p>
                ) : (
                  <ul className="space-y-2" aria-label="Conversations">
                    {(convQ.data?.conversations ?? []).length === 0 ? (
                      <li className="text-sm text-neutral-500">Aucune conversation pour cet utilisateur.</li>
                    ) : (
                      (convQ.data?.conversations ?? []).map((c) => (
                        <li
                          key={String(c.id ?? c.session_id)}
                          className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <p className="font-medium text-neutral-900 dark:text-white">{String(c.title ?? c.name ?? "Sans titre")}</p>
                          <p className="text-xs text-neutral-500">
                            {c.updated_at ? formatRelative(String(c.updated_at)) : ""} · {String(c.model ?? "—")}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </Tabs.Content>

              <Tabs.Content value="security" className="p-4 outline-none">
                <Card className="mb-3 p-4 text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">Sessions & accès API</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Révoquez les sessions via votre IdP ou endpoint dédié. Ci-dessous : extrait des appels récents renvoyés par la vue 360°.
                  </p>
                </Card>
                <Card className="p-4 text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">Journal d’activité</p>
                  <ul className="mt-2 space-y-2" aria-label="Audit timeline">
                    {activityQ.isLoading ? (
                      <li className="text-neutral-500">Chargement…</li>
                    ) : (
                      (activityQ.data?.events ?? []).map((ev, i) => {
                        const row = ev as Record<string, unknown>;
                        return (
                          <li key={i} className="flex gap-2 rounded-lg border border-neutral-100 px-2 py-2 dark:border-slate-800">
                            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                            <div>
                              <p className="font-medium text-neutral-800 dark:text-neutral-100">{String(row.title)}</p>
                              <p className="text-xs text-neutral-500">{formatRelative(row.at as string)}</p>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </Card>
                <Card className="mt-3 p-4 text-sm">
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">Requêtes récentes</p>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                    {((data?.recent_usage as Array<Record<string, unknown>>) ?? []).slice(0, 12).map((r, i) => (
                      <li key={i}>
                        {String(r.endpoint)} · {String(r.status_code)} · {formatRelative(r.created_at as string)}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="analytics" className="p-4 outline-none">
                <Card className="space-y-3 p-4 text-sm">
                  <ScoreRow label="Engagement prédit" value={Number(predictions.engagement_score ?? scores.engagement_score ?? 0)} />
                  <ScoreRow label="Risque résiliation" value={Number(predictions.churn_risk ?? scores.churn_risk ?? 0)} invert />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Santé : <strong>{String(predictions.health_label ?? scores.health_label ?? "—")}</strong>
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Valeur estimée : <strong>{String(predictions.ltv_estimate_usd ?? "—")}</strong>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Modèle : <code>{String(predictions.model_version ?? "heuristic-v1")}</code> — brancher votre scoring ML pour churn / upsell.
                  </p>
                </Card>
                <Card className="mt-3 p-4">
                  <p className="text-xs font-semibold uppercase text-neutral-500">Comportement</p>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Heatmaps, parcours et features adoption : reliez <code className="text-xs">/admin/analytics/*</code> filtré par{" "}
                    <code className="text-xs">user_id</code>.
                  </p>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="notes_tags" className="space-y-6 p-4 outline-none">
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-neutral-500">
                    <StickyNote className="h-3.5 w-3.5" /> Notes internes
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Note interne (auditée)…"
                      className="rounded-xl"
                      aria-label="Nouvelle note"
                    />
                    <Button
                      size="sm"
                      disabled={!noteDraft.trim() || noteMut.isPending}
                      onClick={() => {
                        noteMut.mutate(noteDraft);
                        setNoteDraft("");
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {notes.map((n) => (
                      <li key={String(n.id)} className="rounded-xl border border-neutral-200/80 p-3 text-sm dark:border-slate-700">
                        <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">{String(n.content)}</p>
                        <p className="mt-1 text-xs text-neutral-500">{formatRelative(n.created_at as string)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-neutral-500">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        onClick={() => {
                          if (confirm(`Retirer le tag « ${t.tag} » ?`)) tagMut.remove.mutate(t.tag);
                        }}
                      >
                        {t.tag} ×
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="Nouveau tag" className="rounded-xl" />
                    <Button
                      size="sm"
                      disabled={!tagDraft.trim()}
                      loading={tagMut.add.isPending}
                      onClick={() => {
                        tagMut.add.mutate(tagDraft.trim());
                        setTagDraft("");
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="danger" className="space-y-4 p-4 outline-none">
                <div className="rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40">
                  <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-4 w-4" /> Zone critique
                  </p>
                  <p className="mt-2 text-xs text-red-800/90 dark:text-red-200/90">
                    Chaque action est tracée (raison obligatoire). Les suppressions RGPD nécessitent un mot de passe administrateur côté API.
                  </p>
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-medium text-red-900 dark:text-red-200" htmlFor="danger-reason">
                      Raison / référence ticket
                    </label>
                    <Input
                      id="danger-reason"
                      value={dangerReason}
                      onChange={(e) => setDangerReason(e.target.value)}
                      placeholder="Ex. TOS-4921 — contenu illicite"
                      className="rounded-xl border-red-200 dark:border-red-900/50"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-medium text-red-900 dark:text-red-200" htmlFor="danger-confirm">
                      Pour effacement RGPD, tapez <strong>SUPPRIMER</strong>
                    </label>
                    <Input
                      id="danger-confirm"
                      value={dangerConfirm}
                      onChange={(e) => setDangerConfirm(e.target.value)}
                      className="rounded-xl border-red-200 dark:border-red-900/50"
                      autoComplete="off"
                    />
                  </div>
                  {isBlocked && (
                    <p className="mt-3 rounded-lg bg-amber-100/80 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                      Statut actuel : <strong>{accountStatus}</strong>
                      {statusReason ? ` — ${statusReason}` : ""}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isBlocked ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={reactivateMut.isPending}
                        onClick={() => reactivateMut.mutate()}
                      >
                        Réactiver le compte
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={suspendMut.isPending}
                          disabled={!dangerReason.trim()}
                          onClick={() => requireReason() && suspendMut.mutate()}
                        >
                          Suspendre
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
                          loading={banMut.isPending}
                          disabled={!dangerReason.trim()}
                          onClick={() => requireReason() && banMut.mutate()}
                        >
                          Bannir définitivement
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" loading={delMut.isPending} onClick={onDelete}>
                      Effacer données (RGPD)
                    </Button>
                  </div>
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}

function ScoreRow({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  const color = invert
    ? v >= 66
      ? "bg-red-500"
      : v >= 40
        ? "bg-amber-500"
        : "bg-emerald-500"
    : v >= 66
      ? "bg-emerald-500"
      : v >= 40
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
        <span>{label}</span>
        <span className="tabular-nums">{v}/100</span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
