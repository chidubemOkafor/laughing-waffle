"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

const permissionGroups = [
  {
    title: "Content",
    permissions: [
      { label: "Read published posts", value: "content:read" },
      { label: "Create posts only", value: "content:create" }
    ]
  }
];

const presets = [
  { label: "Public delivery", scopes: ["content:read"] },
  { label: "Create posts only", scopes: ["content:create"] }
];

function parseExpiration(value: string) {
  return Number(value);
}

export default function NewApiKeyPage() {
  const { activeProject } = useProjects();
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["content:read"]);
  const [secret, setSecret] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleScope(scope: string) {
    setSelectedScopes([scope]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSecret("");
    setMaskedKey("");

    if (selectedScopes.length === 0) {
      setError("Select at least one permission.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.get("name"),
          environment: formData.get("environment"),
          scopes: selectedScopes,
          expiresInDays: parseExpiration(String(formData.get("expiresInDays") ?? "never"))
        })
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to create API key.");
        return;
      }

      setSecret(data.secret ?? "");
      setMaskedKey(data.apiKey?.maskedKey ?? "");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <form className="mx-auto max-w-5xl space-y-6" onSubmit={handleSubmit}>
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">API keys</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Create API key</h2>
            <p className="mt-2 text-sm text-slate">Generate a key for {activeProject.name}.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/api-keys"
              className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="h-10 rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate key"}
            </button>
          </div>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

        {secret ? (
          <section className="rounded-lg border border-[rgba(35,184,169,0.28)] bg-[rgba(35,184,169,0.08)] p-4">
            <h3 className="text-base font-semibold text-ink">Copy this key now</h3>
            <p className="mt-2 text-sm text-slate">This secret is shown once. You will not be able to view it again.</p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-cloud bg-white p-3 font-mono text-xs text-ink">
              {secret}
            </div>
            <Link href="/dashboard/api-keys" className="mt-4 inline-flex text-sm font-semibold text-ink">
              Back to API keys
            </Link>
          </section>
        ) : null}

        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Key details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-ink">Key name</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="name"
                    placeholder="Website delivery"
                    type="text"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Environment</span>
                  <select
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="environment"
                    defaultValue="production"
                  >
                    <option value="production">Production</option>
                    <option value="preview">Preview</option>
                    <option value="development">Development</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Expiration</span>
                  <select
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="expiresInDays"
                    defaultValue="90"
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Permissions</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {permissionGroups.map((group) => (
                  <div key={group.title} className="rounded-lg border border-cloud p-3">
                    <p className="text-sm font-semibold text-ink">{group.title}</p>
                    <div className="mt-3 space-y-3">
                      {group.permissions.map((permission) => (
                        <label key={permission.value} className="flex items-start gap-2 text-sm text-slate">
                          <input
                            className="mt-0.5 h-4 w-4 rounded border-cloud text-coral focus:ring-coral"
                            type="radio"
                            name="scope"
                            checked={selectedScopes.includes(permission.value)}
                            onChange={() => toggleScope(permission.value)}
                          />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Recommended presets</h3>
              <div className="mt-4 space-y-3">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="block w-full rounded-lg border border-cloud px-3 py-3 text-left text-sm font-semibold text-ink transition hover:border-slate/40"
                    onClick={() => setSelectedScopes(preset.scopes)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-ink p-4 text-white shadow-sm">
              <h3 className="text-base font-semibold">Key preview</h3>
              <p className="mt-1 text-sm text-white/60">The secret is shown once after generation.</p>
              <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/75">
                {maskedKey || "lw_live_************"}
              </div>
            </section>
          </aside>
        </section>
      </form>
    </main>
  );
}
