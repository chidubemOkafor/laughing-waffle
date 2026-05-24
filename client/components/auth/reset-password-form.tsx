"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { API_URL } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to reset password.");
        return;
      }

      setSuccess("Password reset successfully. You can now sign in.");
      event.currentTarget.reset();
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">
          This reset link is missing a token. Request a new password reset email.
        </p>
        <Link
          href="/forgot-password"
          className="block h-11 rounded-lg bg-ink px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1b2029]"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">New password</span>
        <input
          className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
          type="password"
          name="password"
          placeholder="Create a new password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Confirm password</span>
        <input
          className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}
      {success ? <p className="rounded-lg bg-[rgba(52,168,122,0.12)] px-3 py-2 text-sm text-[#217250]">{success}</p> : null}

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1b2029] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading || Boolean(success)}
      >
        {loading ? "Resetting password..." : "Reset password"}
      </button>

      {success ? (
        <Link href="/login" className="block text-center text-sm font-semibold text-ink">
          Back to sign in
        </Link>
      ) : null}
    </form>
  );
}
