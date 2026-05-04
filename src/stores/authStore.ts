import { create } from "zustand";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "moderator" | "analyst" | "support";
  avatar?: string;
  permissions: string[];
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: (user, token) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("admin_token", token);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_token");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === "super_admin") return true;
    return user.permissions.includes(permission);
  },
}));
