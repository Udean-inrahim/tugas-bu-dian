import { create } from "zustand";
import api from "@/lib/api";
import type { LoginResponse, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
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

function writeAuth(token: string, user: User, remember: boolean) {
  const target = remember ? window.localStorage : window.sessionStorage;
  const other = remember ? window.sessionStorage : window.localStorage;
  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, JSON.stringify(user));
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
}

function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  get isAuthenticated(): boolean {
    return Boolean(get().token);
  },

  login: async (email: string, password: string, remember = true) => {
    set({ loading: true });
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      writeAuth(data.token, data.user, remember);
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
      writeAuth(data.token, data.user, true);
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
      clearAuth();
      set({ user: null, token: null, loading: false });
    }
  },

  loadFromStorage: () => {
    const token =
      window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
    const rawUser =
      window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as User;
        set({ user, token, hydrated: true });
      } catch {
        clearAuth();
        set({ user: null, token: null, hydrated: true });
      }
    } else {
      set({ user: null, token: null, hydrated: true });
    }
  },
}));