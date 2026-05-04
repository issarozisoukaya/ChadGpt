"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUsersStore } from "../store/usersStore";

export function AdvancedFiltersDrawer() {
  const open = useUsersStore((s) => s.filtersOpen);
  const setOpen = useUsersStore((s) => s.setFiltersOpen);
  const filters = useUsersStore((s) => s.filters);
  const setFilters = useUsersStore((s) => s.setFilters);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/30 lg:left-[260px]"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 top-0 z-[61] w-full max-w-sm border-r border-neutral-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950 lg:left-[260px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adv-filters-title"
          >
            <div className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-violet-600" aria-hidden />
                <h2 id="adv-filters-title" className="text-sm font-semibold">
                  Filtres avancés
                </h2>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setOpen(false)} aria-label="Fermer les filtres">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400" htmlFor="flt-country">
                  Pays (ISO-2)
                </label>
                <Input
                  id="flt-country"
                  value={filters.country_code}
                  onChange={(e) => setFilters({ country_code: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="FR, US…"
                  className="mt-1 rounded-xl"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400" htmlFor="flt-tags">
                  Tags (AND, virgule)
                </label>
                <Input
                  id="flt-tags"
                  value={filters.tags}
                  onChange={(e) => setFilters({ tags: e.target.value })}
                  placeholder="vip, power-user"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400" htmlFor="flt-from">
                  Inscrit après
                </label>
                <Input
                  id="flt-from"
                  type="datetime-local"
                  value={filters.date_from ? filters.date_from.slice(0, 16) : ""}
                  onChange={(e) => setFilters({ date_from: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400" htmlFor="flt-to">
                  Inscrit avant
                </label>
                <Input
                  id="flt-to"
                  type="datetime-local"
                  value={filters.date_to ? filters.date_to.slice(0, 16) : ""}
                  onChange={(e) => setFilters({ date_to: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <Button
                variant="secondary"
                className="w-full rounded-xl"
                onClick={() => {
                  useUsersStore.getState().resetFilters();
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
