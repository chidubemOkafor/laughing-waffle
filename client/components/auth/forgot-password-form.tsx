"use client";

import { FormEvent, useState } from "react";
import { API_URL } from "@/lib/api";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.get("email")
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to send reset email.");
        return;
      }

      setSuccess(data?.message ?? "If an account exists for that email, a password reset link has been sent.");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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

      {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}
      {success ? <p className="rounded-lg bg-[rgba(52,168,122,0.12)] px-3 py-2 text-sm text-[#217250]">{success}</p> : null}

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1b2029] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
      >
        {loading ? "Sending reset link..." : "Send reset link"}
      </button>
    </form>
  );
}
