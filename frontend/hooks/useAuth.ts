"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { useOrgStore } from "@/stores/orgStore";
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  User,
} from "@/types";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api<AuthSession>("/auth/login", { method: "POST", body: payload, auth: false }),
    onSuccess: (session) => {
      setSession(session.user, session.accessToken);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api<{ user: User; verificationRequired: boolean }>("/auth/register", {
        method: "POST",
        body: payload,
        auth: false,
      }),
    onSuccess: () => router.push("/auth/verify-email"),
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearOrg = useOrgStore((s) => s.clear);

  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      clearSession();
      clearOrg();
      qc.clear();
      router.push("/auth/login");
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      api<void>("/auth/verify-email", { method: "POST", body: payload, auth: false }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      api<void>("/auth/verify-email/resend", {
        method: "POST",
        body: { email },
        auth: false,
      }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      api<void>("/auth/forgot-password", { method: "POST", body: payload, auth: false }),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      api<void>("/auth/reset-password", { method: "POST", body: payload, auth: false }),
    onSuccess: () => router.push("/auth/login"),
  });
}

/** Hydrates `req.user` from the server; bound to the auth store. */
export function useMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const user = await api<User>("/auth/me", { tenant: false });
      setUser(user);
      return user;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
