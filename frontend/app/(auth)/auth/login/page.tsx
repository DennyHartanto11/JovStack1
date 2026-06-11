"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Sign in to JovStack</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back! Please enter your details.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (login.isPending) return;
          login.mutate({ email, password });
        }}
      >
        {login.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {login.error instanceof ApiError ? login.error.message : "Login failed."}
          </p>
        )}
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-[var(--accent)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-medium text-[var(--accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
