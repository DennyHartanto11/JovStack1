"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { useResetPassword } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const reset = useResetPassword();
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Set new password</h1>
      <p className="mt-1 text-sm text-slate-500">Your new password must be different from previous ones.</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (mismatch) return;
          reset.mutate({ token, password, confirmPassword });
        }}
      >
        {reset.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {reset.error instanceof ApiError ? reset.error.message : "Reset failed."}
          </p>
        )}
        <div>
          <Label>New Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          {mismatch && <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>}
        </div>
        <Button type="submit" className="w-full" disabled={reset.isPending || !token}>
          {reset.isPending ? "Resetting…" : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
