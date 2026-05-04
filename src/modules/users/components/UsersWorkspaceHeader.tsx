"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Download,
  FolderInput,
  Layers,
  Maximize2,
  Minimize2,
  Search,
  Settings2,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useUsersStore } from "../store/usersStore";
import { adminApi } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface UsersWorkspaceHeaderProps {
  total: number;
  selectedCount: number;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function UsersWorkspaceHeader({
  total,
  selectedCount,
  onRefresh,
  isLoading,
}: UsersWorkspaceHeaderProps) {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const workspaceTab = useUsersStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUsersStore((s) => s.setWorkspaceTab);
  const [fs, setFs] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const toggleFs = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.error("Plein écran impossible"));
      setFs(true);
    } else {
      document.exitFullscreen();
      setFs(false);
    }
  };

  const exportFmt = async (format: "csv" | "json") => {
    try {
      if (format === "csv") {
        const blob = await adminApi.users.exportBlob("csv");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export CSV prêt");
      } else {
        const blob = await adminApi.users.exportBlob("json");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export JSON prêt");
      }
    } catch {
      toast.error("Export échoué — vérifiez l’API");
    }
  };

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40">
      <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          Command Center
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
        <Link href="/users" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          User Intelligence
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
        <span className="text-neutral-700 dark:text-neutral-200" aria-current="page">
          Opérations
        </span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
            Centre de décision utilisateurs
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            {total.toLocaleString("fr-FR")} comptes indexés
            {selectedCount > 0 ? ` · ${selectedCount} sélectionné(s)` : ""} · audit, segments et automations branchés API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-neutral-200/90 bg-white/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setWorkspaceTab("operations")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                workspaceTab === "operations"
                  ? "bg-violet-500/20 text-violet-800 dark:text-violet-200"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-slate-800"
              )}
            >
              Opérations
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("analytics")}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                workspaceTab === "analytics"
                  ? "bg-violet-500/20 text-violet-800 dark:text-violet-200"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-slate-800"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics embarqué
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl"
            icon={<Search className="h-3.5 w-3.5" />}
            onClick={() => setCommandOpen(true)}
          >
            Recherche
            <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-neutral-200 bg-neutral-100 px-1 text-[10px] sm:inline-flex dark:border-slate-600 dark:bg-slate-800">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </Button>

          <div className="relative inline-flex">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => exportFmt("csv")}
            >
              Exporter
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl px-2" onClick={() => exportFmt("json")} title="JSON">
              JSON
            </Button>
          </div>

          <input ref={importRef} type="file" accept=".csv,.json" className="hidden" onChange={() => toast.info("Import — valider côté serveur (/admin/users/import)")} />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            icon={<FolderInput className="h-3.5 w-3.5" />}
            onClick={() => importRef.current?.click()}
          >
            Importer
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            icon={<Layers className="h-3.5 w-3.5" />}
            onClick={() => toast.message("Actions groupées", { description: "Utilisez la barre de sélection ou POST /admin/users/bulk" })}
          >
            Bulk
          </Button>

          <Link href="/settings">
            <Button variant="ghost" size="sm" className="rounded-xl" icon={<Settings2 className="h-3.5 w-3.5" />}>
              Paramètres
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            icon={fs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            onClick={toggleFs}
            aria-pressed={fs}
          />

          <Button variant="ghost" size="sm" className="rounded-xl" onClick={onRefresh} disabled={isLoading} title="Actualiser">
            <span className={cn(isLoading && "animate-spin")}>↻</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
