import { create } from "zustand";
import api from "@/lib/api";
import type { LoginResponse, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
  get isAuthenticated(): boolean;
}

const TOKEN_KEY = "stm_token";
const USER_KEY = "stm_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,

  get isAuthenticated(): boolean {
    return Boolean(get().token);
  },

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ user: null, token: null, loading: false });
    }
  },

  loadFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as User;
        set({ user, token });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ user: null, token: null });
      }
    }
  },
}));