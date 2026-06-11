import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  issuedAt: number | null;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

const AUTH_CHANNEL =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("jovstack-auth")
    : null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      issuedAt: null,
      setSession: (user, accessToken) => {
        const now = Date.now();
        set({ user, accessToken, issuedAt: now });
        AUTH_CHANNEL?.postMessage({ type: "TOKEN_UPDATED", accessToken, issuedAt: now });
      },
      setAccessToken: (accessToken) => {
        const now = Date.now();
        set({ accessToken, issuedAt: now });
        AUTH_CHANNEL?.postMessage({ type: "TOKEN_UPDATED", accessToken, issuedAt: now });
      },
      setUser: (user) => set({ user }),
      clearSession: () => {
        set({ user: null, accessToken: null, issuedAt: null });
        AUTH_CHANNEL?.postMessage({ type: "SESSION_CLEARED" });
      },
      isAuthenticated: () => {
        const state = get();
        if (!state.accessToken || !state.issuedAt) return false;
        // Access token typically lives 15 min — if stored > 1 hour, treat as expired
        if (Date.now() - state.issuedAt > 60 * 60 * 1000) {
          state.clearSession();
          return false;
        }
        return true;
      },
    }),
    {
      name: "jovstack-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        issuedAt: s.issuedAt,
      }),
    }
  )
);

// Listen for token updates from other tabs
if (typeof BroadcastChannel !== "undefined") {
  AUTH_CHANNEL?.addEventListener("message", (e) => {
    if (e.data.type === "TOKEN_UPDATED") {
      useAuthStore.setState({
        accessToken: e.data.accessToken,
        issuedAt: e.data.issuedAt,
      });
    } else if (e.data.type === "SESSION_CLEARED") {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        issuedAt: null,
      });
    }
  });
}