"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/client";
import { supabaseAdminUsers } from "@/lib/api/supabase-admin-users";
import { getUsersDataSource } from "@/lib/users-data-source";
import { useUsersStore } from "../store/usersStore";
import { toast } from "sonner";
import { useState } from "react";
export function UserQuickActionsDrawer() {
  const uid = useUsersStore((s) => s.quickActionsUserId);
  const setUid = useUsersStore((s) => s.setQuickActionsUserId);

  const qc = useQueryClient();
  const [credits, setCredits] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const close = () => {
    setUid(null);
    setCredits("");
    setCreditReason("");
  };

  const updatePlan = useMutation({
    mutationFn: async (plan: string) => {
      if (getUsersDataSource() === "supabase") {
        await supabaseAdminUsers.update(uid!, { subscription_tier: plan });
        return;
      }
      await adminApi.users.update(uid!, { plan, subscription_tier: plan } as Record<string, unknown>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", "360", uid] });
      toast.success("Plan mis à jour");
      close();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const giveCredits = useMutation({
    mutationFn: async () => {
      const n = Number(credits);
      if (!Number.isFinite(n) || n === 0) throw new Error("Montant invalide");
      if (getUsersDataSource() === "supabase") {
        await supabaseAdminUsers.update(uid!, { credits_delta: n });
        return;
      }
      await adminApi.users.action(uid!, "grant_credits", { amount: n, reason: creditReason || "Crédits admin" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", "360", uid] });
      toast.success("Crédits mis à jour");
      close();
    },
    onError: (e: Error) => toast.error(e.message || "Action impossible via l’API active"),
  });

  if (!uid) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] bg-slate-950/40"
          onClick={close}
        />
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-0 right-0 top-0 z-[56] flex w-full max-w-md flex-col border-l border-neutral-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-actions-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" aria-hidden />
              <h2 id="quick-actions-title" className="text-sm font-semibold">
                Actions rapides
              </h2>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={close} aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </header>
          <div className="space-y-6 overflow-y-auto p-4 text-sm">
            <p className="text-xs text-neutral-500">
              Utilisateur{" "}
              <span className="font-mono text-neutral-700 dark:text-neutral-300">{uid.slice(0, 8)}…</span>
              <br />
              <span className="text-neutral-400">Les données complètes sont dans la fiche (double-clic).</span>
            </p>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Plan</p>
              <div className="flex flex-wrap gap-2">
                {(["free", "pro", "enterprise"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl capitalize"
                    loading={updatePlan.isPending}
                    onClick={() => {
                      if (!confirm(`Attribuer le plan « ${p} » ?`)) return;
                      updatePlan.mutate(p);
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Crédits (+/-)</p>
              <Input
                inputMode="numeric"
                placeholder="Montant (+/-)"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="rounded-xl"
              />
              <Input
                placeholder="Raison (audit)"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="rounded-xl"
              />
              <Button
                className="w-full rounded-xl"
                variant="secondary"
                loading={giveCredits.isPending}
                onClick={() => {
                  if (!creditReason.trim()) {
                    toast.error("La raison est obligatoire pour l’audit.");
                    return;
                  }
                  if (!confirm("Confirmer l’ajustement des crédits ?")) return;
                  giveCredits.mutate();
                }}
              >
                Appliquer les crédits
              </Button>
              {getUsersDataSource() !== "supabase" && (
                <p className="text-[11px] text-neutral-500">
                  Mode API REST : nécessite un handler <code className="rounded bg-neutral-100 px-1 dark:bg-slate-800">grant_credits</code>{" "}
                  côté backend.
                </p>
              )}
            </section>
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}
