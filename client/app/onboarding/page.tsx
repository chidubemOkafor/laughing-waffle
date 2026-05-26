"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { API_URL } from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }

        const projectsRes = await fetch(`${API_URL}/api/projects`, { credentials: "include" });
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    }

    check();
  }, [router]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, slug })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message ?? "Unable to create project.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <main className="flex min-h-screen flex-col bg-paper px-4 text-ink">
      <div className="flex h-16 items-center">
        <BrandLogo />
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-slate">Step 1 of 1</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Create your first project</h1>
          <p className="mt-3 text-sm leading-6 text-slate">
            Projects hold your posts, media, and API keys. You can create more later.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Project name</span>
              <input
                className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                type="text"
                placeholder="My blog"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                minLength={2}
                maxLength={80}
                autoFocus
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Slug</span>
              <input
                className="h-11 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                type="text"
                placeholder="my-blog"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                minLength={2}
                maxLength={80}
                required
              />
              <span className="text-xs text-slate">Used in your API endpoint URL.</span>
            </label>

            {error ? (
              <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p>
            ) : null}

            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1b2029] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create project and go to dashboard"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
