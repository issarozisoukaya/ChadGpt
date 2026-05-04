import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  selectedTheme: "light" | "dark" | "system";

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleCommand: () => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  selectedTheme: "dark",

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleCommand: () =>
    set((state) => ({ commandOpen: !state.commandOpen })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setTheme: (selectedTheme) => set({ selectedTheme }),
}));
