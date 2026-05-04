import { create } from "zustand";

export type UsersViewMode = "table" | "cards" | "compact" | "kanban" | "timeline" | "analytics";

export interface UsersListFilters {
  search: string;
  plan: string;
  status: string;
  country_code: string;
  tags: string;
  date_from: string;
  date_to: string;
  sort: string;
  order: "asc" | "desc";
}

const defaultFilters: UsersListFilters = {
  search: "",
  plan: "all",
  status: "all",
  country_code: "",
  tags: "",
  date_from: "",
  date_to: "",
  sort: "created_at",
  order: "desc",
};

export const DEFAULT_COLUMN_IDS = [
  "user",
  "email_meta",
  "plan",
  "status",
  "conversations",
  "messages",
  "tokens",
  "engagement",
  "sparkline",
  "geo",
  "created",
  "activity",
  "actions",
] as const;

export type UsersColumnId = (typeof DEFAULT_COLUMN_IDS)[number];

const defaultColumnVisibility: Record<UsersColumnId, boolean> = {
  user: true,
  email_meta: true,
  plan: true,
  status: true,
  conversations: true,
  messages: true,
  tokens: true,
  engagement: true,
  sparkline: true,
  geo: true,
  created: true,
  activity: true,
  actions: true,
};

interface UsersUiState {
  filtersOpen: boolean;
  viewMode: UsersViewMode;
  preset: string | null;
  filters: UsersListFilters;
  selectedIds: Set<string>;
  detailUserId: string | null;
  focusedUserId: string | null;
  pageSize: number;
  contextRailCollapsed: boolean;
  workspaceTab: "operations" | "analytics";
  columnVisibility: Record<UsersColumnId, boolean>;
  searchHistory: string[];
  setFiltersOpen: (v: boolean) => void;
  setViewMode: (m: UsersViewMode) => void;
  setPreset: (p: string | null) => void;
  setFilters: (p: Partial<UsersListFilters>) => void;
  resetFilters: () => void;
  setDetailUserId: (id: string | null) => void;
  setFocusedUserId: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setPageSize: (n: number) => void;
  setContextRailCollapsed: (v: boolean) => void;
  toggleContextRail: () => void;
  setWorkspaceTab: (t: "operations" | "analytics") => void;
  setColumnVisible: (id: UsersColumnId, visible: boolean) => void;
  resetColumnLayout: () => void;
  pushSearchHistory: (q: string) => void;
}

export const useUsersStore = create<UsersUiState>((set, get) => ({
  filtersOpen: false,
  viewMode: "table",
  preset: null,
  filters: { ...defaultFilters },
  selectedIds: new Set(),
  detailUserId: null,
  focusedUserId: null,
  pageSize: 50,
  contextRailCollapsed: false,
  workspaceTab: "operations",
  columnVisibility: { ...defaultColumnVisibility },
  searchHistory: [],
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPreset: (preset) => set({ preset }),
  setFilters: (partial) => set({ filters: { ...get().filters, ...partial } }),
  resetFilters: () => set({ filters: { ...defaultFilters }, preset: null }),
  setDetailUserId: (detailUserId) =>
    set((s) => ({
      detailUserId,
      focusedUserId: detailUserId ?? s.focusedUserId,
    })),
  setFocusedUserId: (focusedUserId) => set({ focusedUserId }),
  toggleSelect: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) {
      next.delete(id);
      set({ selectedIds: next });
    } else {
      next.add(id);
      set({ selectedIds: next, focusedUserId: id });
    }
  },
  clearSelection: () => set({ selectedIds: new Set() }),
  setPageSize: (pageSize) => set({ pageSize }),
  setContextRailCollapsed: (contextRailCollapsed) => set({ contextRailCollapsed }),
  toggleContextRail: () => set((s) => ({ contextRailCollapsed: !s.contextRailCollapsed })),
  setWorkspaceTab: (workspaceTab) => set({ workspaceTab }),
  setColumnVisible: (id, visible) =>
    set((s) => ({
      columnVisibility: { ...s.columnVisibility, [id]: visible },
    })),
  resetColumnLayout: () => set({ columnVisibility: { ...defaultColumnVisibility } }),
  pushSearchHistory: (q) => {
    const t = q.trim();
    if (!t) return;
    const prev = get().searchHistory.filter((x) => x !== t);
    set({ searchHistory: [t, ...prev].slice(0, 12) });
  },
}));
