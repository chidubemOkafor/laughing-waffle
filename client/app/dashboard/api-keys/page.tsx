"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjectApiBase, useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";
import { cachedFetch, invalidateCache } from "@/lib/fetch-cache";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  maskedKey: string;
  environment: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

function formatEnvironment(environment: string) {
  return environment.charAt(0).toUpperCase() + environment.slice(1);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatScopes(scopes: string[]) {
  return scopes.length > 0 ? scopes : ["No scopes"];
}

export default function ApiKeysPage() {
  const { activeProject } = useProjects();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState("");
  const [pendingRevokeKey, setPendingRevokeKey] = useState<ApiKey | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApiKeys() {
      setLoading(true);
      setError("");

      try {
        const response = await cachedFetch(`${API_URL}/api/projects/${activeProject.id}/api-keys`, {
          credentials: "include",
          ttl: 120_000
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error?.message ?? "Unable to load API keys.");
        }

        if (active) {
          setApiKeys(Array.isArray(data.apiKeys) ? data.apiKeys : []);
        }
      } catch (caughtError) {
        if (active) {
          setApiKeys([]);
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load API keys.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadApiKeys();

    return () => {
      active = false;
    };
  }, [activeProject.id]);

  async function revokeApiKey() {
    if (!pendingRevokeKey) {
      return;
    }

    setError("");
    setRevokingId(pendingRevokeKey.id);

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/api-keys/${pendingRevokeKey.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Unable to revoke API key.");
      }

      setApiKeys((currentKeys) => currentKeys.filter((key) => key.id !== pendingRevokeKey.id));
      setPendingRevokeKey(null);
      invalidateCache(`/api/projects/${activeProject.id}/api-keys`);
      invalidateCache(`/api/projects/${activeProject.id}/dashboard`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to revoke API key.");
    } finally {
      setRevokingId("");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">API keys</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Developer access</h2>
            <p className="mt-2 text-sm text-slate">Live keys for {activeProject.name}</p>
          </div>
          <Link
            href="/dashboard/api-keys/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
          >
            Create API key
          </Link>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-lg border border-cloud bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,260px)_120px_110px_90px] gap-4 border-b border-cloud px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate max-xl:hidden">
              <span>Name</span>
              <span>Scopes</span>
              <span>Last used</span>
              <span>Expires</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-cloud">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(180px,260px)_120px_110px_90px] xl:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{key.name}</p>
                      <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-slate">
                        {formatEnvironment(key.environment)}
                      </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-slate">{key.maskedKey}</p>
                  </div>

                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {formatScopes(key.scopes).map((scope) => (
                      <span key={scope} className="max-w-full rounded-full bg-paper px-2 py-1 text-xs font-semibold text-slate">
                        {scope}
                      </span>
                    ))}
                  </div>

                  <span className="text-sm text-slate">{key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}</span>
                  <span className="text-sm text-slate">{formatDate(key.expiresAt)}</span>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-[rgba(255,107,90,0.28)] px-3 text-sm font-semibold text-[#b83628] transition hover:bg-[rgba(255,107,90,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={revokingId === key.id}
                    onClick={() => setPendingRevokeKey(key)}
                  >
                    {revokingId === key.id ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              ))}

              {loading ? <div className="px-4 py-8 text-center text-sm text-slate">Loading live API keys...</div> : null}

              {!loading && apiKeys.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <h3 className="text-base font-semibold text-ink">No API keys yet</h3>
                  <p className="mt-2 text-sm text-slate">Create a key for {activeProject.name} to use the content API.</p>
                  <Link
                    href="/dashboard/api-keys/new"
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
                  >
                    Create API key
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="min-w-0 rounded-lg border border-cloud bg-ink p-4 text-white shadow-sm">
            <h3 className="text-base font-semibold">Current endpoint</h3>
            <p className="mt-1 text-sm text-white/60">Use project keys with this public route.</p>
            <div className="mt-5 max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/75">
              GET {getProjectApiBase(activeProject)}
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/65">
              <p>Use read keys only for server-side delivery of published content.</p>
              <p>Rotate keys regularly and revoke anything exposed.</p>
            </div>
            <Link
              href="/dashboard/docs"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-white px-3 text-sm font-semibold text-ink transition hover:bg-paper"
            >
              View docs
            </Link>
          </aside>
        </section>
      </div>

      {pendingRevokeKey ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-8 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-cloud bg-white p-5 shadow-soft">
            <div className="rounded-full bg-[rgba(255,107,90,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b83628]">
              Revoke key
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink">Revoke this API key?</h3>
            <p className="mt-2 text-sm leading-6 text-slate">
              Apps using <span className="font-semibold text-ink">{pendingRevokeKey.name}</span> will stop working immediately.
              This key will disappear from the active list.
            </p>
            <div className="mt-4 rounded-lg border border-cloud bg-paper p-3 font-mono text-xs text-slate">
              {pendingRevokeKey.maskedKey}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
                disabled={revokingId === pendingRevokeKey.id}
                onClick={() => setPendingRevokeKey(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-[#b83628] px-4 text-sm font-semibold text-white transition hover:bg-[#9f2e23] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={revokingId === pendingRevokeKey.id}
                onClick={revokeApiKey}
              >
                {revokingId === pendingRevokeKey.id ? "Revoking..." : "Revoke API key"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
