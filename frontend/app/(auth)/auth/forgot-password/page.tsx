"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useForgotPassword } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const forgot = useForgotPassword();

  if (forgot.isSuccess) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
          <MailCheck size={24} />
        </span>
        <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          If an account exists for that address, we&apos;ve sent a password reset link.
        </p>
        <Link href="/auth/login" className="mt-6 inline-flex items-center gap-1 text-sm text-[var(--accent)]">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Forgot password?</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          forgot.mutate({ email });
        }}
      >
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
        </div>
        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <Link href="/auth/login" className="mt-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
    </div>
  );
}
