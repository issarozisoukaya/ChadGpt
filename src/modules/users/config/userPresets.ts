import type { UsersListFilters } from "../store/usersStore";

export interface UserSegmentPreset {
  id: string;
  label: string;
  description?: string;
  apply: (api: {
    setFilters: (p: Partial<UsersListFilters>) => void;
    resetFilters: () => void;
    setPreset: (p: string | null) => void;
  }) => void;
}

export const USER_SEGMENT_PRESETS: UserSegmentPreset[] = [
  {
    id: "all",
    label: "Tous les utilisateurs",
    description: "Réinitialiser filtres",
    apply: ({ resetFilters, setPreset }) => {
      resetFilters();
      setPreset("all");
    },
  },
  {
    id: "pro",
    label: "Segment Pro",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ plan: "pro", status: "all" });
      setPreset("pro");
    },
  },
  {
    id: "enterprise",
    label: "Enterprise / VIP",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ plan: "enterprise", status: "all" });
      setPreset("enterprise");
    },
  },
  {
    id: "free",
    label: "Plan gratuit",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ plan: "free", status: "all" });
      setPreset("free");
    },
  },
  {
    id: "churn",
    label: "Risque churn / inactifs",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ status: "inactive", plan: "all" });
      setPreset("churn");
    },
  },
  {
    id: "banned",
    label: "Comptes bannis",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ status: "banned", plan: "all" });
      setPreset("banned");
    },
  },
  {
    id: "b2b",
    label: "Clients B2B actifs",
    apply: ({ setFilters, setPreset }) => {
      setFilters({ plan: "enterprise", status: "active" });
      setPreset("b2b");
    },
  },
  {
    id: "new_week",
    label: "Nouveaux (7 derniers jours)",
    apply: ({ setFilters, setPreset }) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 7);
      setFilters({ date_from: d.toISOString(), plan: "all", status: "all" });
      setPreset("new_week");
    },
  },
];
