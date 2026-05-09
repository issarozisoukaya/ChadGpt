"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Mail, UserX, Tags, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUsersStore } from "../store/usersStore";
import { useUsersBulkMutation } from "../hooks/useUsersModule";
export function UsersBulkActionsBar() {
  const selectedIds = useUsersStore((s) => s.selectedIds);
  const clearSelection = useUsersStore((s) => s.clearSelection);
  const bulk = useUsersBulkMutation();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"plan" | "suspend" | "ban" | "tag" | "credits" | null>(null);
  const [plan, setPlan] = useState("pro");
  const [reason, setReason] = useState("");
  const [confirmBan, setConfirmBan] = useState("");
  const [tag, setTag] = useState("");
  const [credits, setCredits] = useState("");

  const ids = [...selectedIds];
  const count = ids.length;

  const reset = () => {
    setMode(null);
    setReason("");
    setConfirmBan("");
    setTag("");
    setCredits("");
  };

  const closeAll = () => {
    setOpen(false);
    reset();
  };

  if (count === 0) return null;

  const runBulk = (
    action: string,
    payload?: Record<string, unknown>,
    extraConfirm?: () => boolean
  ) => {
    if (extraConfirm && !extraConfirm()) return;
    bulk.mutate(
      { user_ids: ids, action, payload },
      {
        onSuccess: () => {
          clearSelection();
          closeAll();
        },
      }
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200/60 bg-violet-50/90 p-3 dark:border-violet-500/25 dark:bg-violet-950/30"
      >
        <span className="text-sm font-medium text-violet-800 dark:text-violet-200">{count} sélectionné(s)</span>
        <Button
          variant="outline"
          size="xs"
          icon={<CreditCard className="h-3 w-3" />}
          onClick={() => {
            setMode("plan");
            setOpen(true);
          }}
        >
          Plan
        </Button>
        <Button
          variant="outline"
          size="xs"
          icon={<CreditCard className="h-3 w-3" />}
          onClick={() => {
            setMode("credits");
            setOpen(true);
          }}
        >
          Crédits
        </Button>
        <Button
          variant="outline"
          size="xs"
          icon={<Tags className="h-3 w-3" />}
          onClick={() => {
            setMode("tag");
            setOpen(true);
          }}
        >
          Tag
        </Button>
        <Button
          variant="outline"
          size="xs"
          icon={<Mail className="h-3 w-3" />}
          onClick={() =>
            toast.message("Email groupé", {
              description: "Branchez votre fournisseur (SMTP / Resend) sur le backend ou une Edge Function.",
            })
          }
        >
          Email
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            setMode("suspend");
            setOpen(true);
          }}
        >
          Suspendre
        </Button>
        <Button
          variant="danger"
          size="xs"
          icon={<UserX className="h-3 w-3" />}
          onClick={() => {
            setOpen(true);
            setMode("ban");
          }}
        >
          Bannir
        </Button>
        <Button variant="ghost" size="xs" onClick={clearSelection}>
          Effacer
        </Button>
      </motion.div>

      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-[1px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <Dialog.Title className="text-base font-semibold text-neutral-900 dark:text-white">
              Actions groupées
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-neutral-500">
              {count} utilisateur(s). Les actions destructives exigent une confirmation explicite.
            </Dialog.Description>

            <div className="mt-4 space-y-3">
              {!mode && (
                <div className="grid gap-2">
                  <Button variant="secondary" className="justify-start rounded-xl" onClick={() => setMode("plan")}>
                    Changer le plan
                  </Button>
                  <Button variant="secondary" className="justify-start rounded-xl" onClick={() => setMode("credits")}>
                    Ajuster les crédits
                  </Button>
                  <Button variant="secondary" className="justify-start rounded-xl" onClick={() => setMode("tag")}>
                    Ajouter un tag
                  </Button>
                  <Button variant="secondary" className="justify-start rounded-xl" onClick={() => setMode("suspend")}>
                    Suspendre (statut)
                  </Button>
                  <Button variant="danger" className="justify-start rounded-xl" onClick={() => setMode("ban")}>
                    Bannir
                  </Button>
                </div>
              )}

              {mode === "plan" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nouveau plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                  <Button
                    className="w-full rounded-xl"
                    loading={bulk.isPending}
                    onClick={() => {
                      if (!confirm(`Passer ${count} utilisateur(s) au plan « ${plan} » ?`)) return;
                      runBulk("set_plan", { plan });
                    }}
                  >
                    Confirmer
                  </Button>
                </div>
              )}

              {mode === "credits" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-600">Montant (+/-)</label>
                  <Input value={credits} onChange={(e) => setCredits(e.target.value)} className="rounded-xl" />
                  <label className="text-xs font-medium text-neutral-600">Raison (audit)</label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl" />
                  <Button
                    className="w-full rounded-xl"
                    variant="secondary"
                    loading={bulk.isPending}
                    onClick={() => {
                      if (!reason.trim()) return;
                      if (!confirm("Confirmer le crédit sur la sélection ?")) return;
                      const amount = Number(credits);
                      if (!Number.isFinite(amount)) return;
                      runBulk("add_credits", { amount, reason });
                    }}
                  >
                    Appliquer
                  </Button>
                </div>
              )}

              {mode === "tag" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-600">Tag</label>
                  <Input value={tag} onChange={(e) => setTag(e.target.value)} className="rounded-xl" placeholder="vip" />
                  <Button
                    className="w-full rounded-xl"
                    loading={bulk.isPending}
                    onClick={() => {
                      if (!tag.trim()) return;
                      if (!confirm(`Ajouter le tag « ${tag.trim()} » à ${count} utilisateur(s) ?`)) return;
                      runBulk("add_tags", { tag: tag.trim() });
                    }}
                  >
                    Ajouter le tag
                  </Button>
                </div>
              )}

              {mode === "suspend" && (
                <div className="space-y-2">
                  <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> Première confirmation : raison obligatoire.
                  </p>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl" placeholder="Raison / ticket" />
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl"
                    loading={bulk.isPending}
                    onClick={() => {
                      if (!reason.trim()) return;
                      if (!confirm(`Suspendre définitivement (statut) ${count} compte(s) ? Seconde étape.`)) return;
                      runBulk("set_status", { status: "suspended", reason });
                    }}
                  >
                    Confirmer suspension
                  </Button>
                </div>
              )}

              {mode === "ban" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    Double confirmation : raison + tapez <strong>BANNIR</strong>.
                  </p>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-xl" placeholder="Raison légale" />
                  <Input
                    value={confirmBan}
                    onChange={(e) => setConfirmBan(e.target.value)}
                    className="rounded-xl border-red-200 dark:border-red-900/50"
                    placeholder="BANNIR"
                    autoComplete="off"
                  />
                  <Button
                    variant="danger"
                    className="w-full rounded-xl"
                    loading={bulk.isPending}
                    onClick={() => {
                      if (!reason.trim()) return;
                      if (confirmBan.trim().toUpperCase() !== "BANNIR") return;
                      if (!confirm(`Dernière confirmation : bannir ${count} compte(s) ?`)) return;
                      runBulk("ban", { reason });
                    }}
                  >
                    Bannir la sélection
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => (mode ? reset() : closeAll())}>
                {mode ? "Retour" : "Fermer"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
