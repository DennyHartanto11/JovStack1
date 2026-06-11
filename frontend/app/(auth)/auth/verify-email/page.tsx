"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useVerifyEmail, useResendVerification } from "@/hooks/useAuth";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const [email, setEmail] = useState("");

  // Auto-verify when arriving from the email link.
  useEffect(() => {
    if (token) verify.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (token) {
    if (verify.isPending) {
      return (
        <Centered icon={<Loader2 className="animate-spin text-[var(--accent)]" size={24} />} title="Verifying your email…" />
      );
    }
    if (verify.isSuccess) {
      return (
        <Centered icon={<CheckCircle2 className="text-green-600" size={24} />} title="Email verified" desc="Your account is now active.">
          <Link href="/auth/login">
            <Button className="mt-6 w-full">Continue to Sign In</Button>
          </Link>
        </Centered>
      );
    }
    return (
      <Centered icon={<AlertCircle className="text-red-500" size={24} />} title="Verification failed" desc="The link is invalid or has expired." />
    );
  }

  // No token: prompt to resend.
  return (
    <Centered icon={<MailCheck className="text-[var(--accent)]" size={24} />} title="Verify your email" desc="We've sent a verification link to your inbox. Click the link to activate your account.">
      <form
        className="mt-6 w-full space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          resend.mutate(email);
        }}
      >
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
        <Button type="submit" className="w-full" disabled={resend.isPending}>
          {resend.isPending ? "Sending…" : resend.isSuccess ? "Sent ✓" : "Resend verification"}
        </Button>
      </form>
      <Link href="/auth/login" className="mt-4 text-sm text-[var(--accent)] hover:underline">
        Back to Sign In
      </Link>
    </Centered>
  );
}

function Centered({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">{icon}</span>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {desc && <p className="mt-2 text-sm text-slate-500">{desc}</p>}
      {children}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
