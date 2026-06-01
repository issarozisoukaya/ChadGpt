"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Command, useCommandState } from "cmdk";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { Search, Sparkles, Mail, Tag, Calendar, Hash } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useUsersStore } from "../store/usersStore";
import { parseUniversalSearch } from "../utils/searchQuery";
import { USER_SEGMENT_PRESETS } from "../config/userPresets";
import { cn } from "@/lib/utils";

function ApplyCurrentSearch({ onApply }: { onApply: (raw: string) => void }) {
  const search = useCommandState((s) => s.search);
  const t = search.trim();
  if (!t) return null;
  return (
    <Command.Group heading="Recherche">
      <Command.Item
        value={`__apply__${t}`}
        className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
        onSelect={() => onApply(t)}
      >
        <Search className="h-3.5 w-3.5 text-violet-500" />
        Appliquer « {t} »
      </Command.Item>
    </Command.Group>
  );
}

interface UsersCommandPaletteProps {
  users: Array<Record<string, unknown>>;
}

export function UsersCommandPalette({ users }: UsersCommandPaletteProps) {
  const open = useUIStore((s) => s.commandOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setFilters = useUsersStore((s) => s.setFilters);
  const resetFilters = useUsersStore((s) => s.resetFilters);
  const setPreset = useUsersStore((s) => s.setPreset);
  const setDetailUserId = useUsersStore((s) => s.setDetailUserId);
  const setFocusedUserId = useUsersStore((s) => s.setFocusedUserId);
  const pushSearchHistory = useUsersStore((s) => s.pushSearchHistory);
  const searchHistory = useUsersStore((s) => s.searchHistory);

  const apply = useCallback(
    (raw: string) => {
      const parsed = parseUniversalSearch(raw);
      setFilters(parsed);
      pushSearchHistory(raw);
      setCommandOpen(false);
    },
    [setFilters, pushSearchHistory, setCommandOpen]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const { commandOpen, setCommandOpen: setOpen } = useUIStore.getState();
        setOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const jumpUsers = useMemo(
    () =>
      users.slice(0, 12).map((u) => ({
        id: u.id as string,
        label: String(u.full_name || u.email || u.id),
        sub: String(u.email || ""),
      })),
    [users]
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setCommandOpen}
      label="Recherche universelle utilisateurs"
      overlayClassName="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-[2px]"
      contentClassName={cn(
        "fixed left-1/2 top-[12vh] z-[101] w-[min(100vw-1.5rem,560px)] -translate-x-1/2",
        "rounded-2xl border border-neutral-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950",
        "overflow-hidden outline-none"
      )}
    >
      <DialogTitle className="sr-only">Recherche universelle utilisateurs</DialogTitle>
      <DialogDescription className="sr-only">
        Filtres, segments et accès rapide aux utilisateurs de la page courante.
      </DialogDescription>
      <div className="flex items-center gap-2 border-b border-neutral-200/80 px-3 dark:border-slate-800">
        <Search className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <Command.Input
          autoFocus
          placeholder="Recherche, opérateurs (email:, plan:, tag:, country:, created:>2024-01-01)…"
          className="h-12 w-full border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400 dark:text-neutral-100"
        />
      </div>
      <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-neutral-500">Aucun résultat.</Command.Empty>

        <ApplyCurrentSearch onApply={apply} />

        <Command.Group heading="Suggestions">
          <Command.Item
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
            onSelect={() => apply("plan:pro status:active")}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            Actifs plan Pro
          </Command.Item>
          <Command.Item
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
            onSelect={() => apply("plan:enterprise")}
          >
            <Hash className="h-3.5 w-3.5 text-violet-500" />
            Filtre Enterprise
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Smart lists">
          {USER_SEGMENT_PRESETS.map((p) => (
            <Command.Item
              key={p.id}
              value={`preset-${p.label}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
              onSelect={() => {
                p.apply({ setFilters, resetFilters, setPreset });
                setCommandOpen(false);
              }}
            >
              <Tag className="h-3.5 w-3.5 text-amber-500" />
              {p.label}
            </Command.Item>
          ))}
        </Command.Group>

        {searchHistory.length > 0 && (
          <Command.Group heading="Historique">
            {searchHistory.map((h) => (
              <Command.Item
                key={h}
                value={`hist-${h}`}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
                onSelect={() => apply(h)}
              >
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                {h}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Aller à l’utilisateur (page courante)">
          {jumpUsers.map((u) => (
            <Command.Item
              key={u.id}
              value={`user-${u.label}-${u.sub}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 aria-selected:bg-violet-500/15 dark:text-neutral-200 dark:aria-selected:bg-violet-500/20"
              onSelect={() => {
                setFocusedUserId(u.id);
                setDetailUserId(u.id);
                setCommandOpen(false);
              }}
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="min-w-0 truncate">{u.label}</span>
              <span className="truncate text-xs text-neutral-500">{u.sub}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="border-t border-neutral-200/80 px-3 py-2 text-[10px] text-neutral-400 dark:border-slate-800">
        <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1 dark:border-slate-600 dark:bg-slate-900">↵</kbd> sur une ligne ·{" "}
        <kbd className="rounded border px-1">Esc</kbd> fermer · <kbd className="rounded border px-1">⌘K</kbd> basculer
      </div>
    </Command.Dialog>
  );
}
