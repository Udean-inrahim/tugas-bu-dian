import { create } from "zustand";
import api from "@/lib/api";
import type { LoginResponse, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
  get isAuthenticated(): boolean;
}

export interface RegisterResult {
  pendingVerification: boolean;
  email: string;
  expiresAt?: string;
  emailSent?: boolean;
  code?: string;
}

const TOKEN_KEY = "stm_token";
const USER_KEY = "stm_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

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

  register: async (name: string, email: string, password: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post<RegisterResult>("/auth/register", {
        name,
        email,
        password,
      });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  verifyEmail: async (email: string, code: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post<LoginResponse>("/auth/verify-email", { email, code });
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
        set({ user, token, hydrated: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ user: null, token: null, hydrated: true });
      }
    } else {
      set({ user: null, token: null, hydrated: true });
    }
  },
}));