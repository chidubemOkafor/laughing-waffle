"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import posthog from "posthog-js";
import { API_URL } from "@/lib/api";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error?.message ?? "Unable to create account.");
        return;
      }

      setEmail(String(formData.get("email") ?? ""));
      setVerificationRequired(true);
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          code: formData.get("code")
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error?.message ?? "Unable to verify email.");
        return;
      }

      posthog.capture("signed_up");

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setNotice("");
    setResending(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to resend verification code.");
        return;
      }

      setNotice(data?.message ?? "If an unverified account exists, a new verification code has been sent.");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setResending(false);
    }
  }

  if (verificationRequired) {
    return (
      <form className="space-y-4" onSubmit={handleVerify}>
        <div className="rounded-lg border border-cloud bg-paper p-3 text-sm text-slate">
          Enter the 6-digit code sent to <span className="font-semibold text-ink">{email}</span>.
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Verification code</span>
          <input
            className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
            type="text"
            name="code"
            placeholder="123456"
            inputMode="numeric"
            minLength={6}
            maxLength={6}
            required
          />
        </label>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}
        {notice ? <p className="rounded-lg bg-[rgba(35,184,169,0.12)] px-3 py-2 text-sm text-[#127b72]">{notice}</p> : null}

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>

        <button
          type="button"
          className="h-11 w-full rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading || resending}
          onClick={handleResendCode}
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Name</span>
        <input
          className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
          type="text"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-ink">Password</span>
        <input
          className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
          type="password"
          name="password"
          placeholder="Create a password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
