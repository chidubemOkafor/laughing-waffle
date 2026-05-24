"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function CreateProjectForm() {
  const router = useRouter();
  const { refreshProjects, setActiveProjectId } = useProjects();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          slug,
          description: formData.get("description"),
          environment: formData.get("environment")
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to create project.");
        return;
      }

      if (data?.project?.id) {
        await refreshProjects();
        setActiveProjectId(data.project.id);
      }

      router.push("/dashboard/settings");
      router.refresh();
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mx-auto max-w-3xl space-y-6" onSubmit={handleSubmit}>
      <section>
        <p className="text-sm font-medium text-slate">Projects</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">Create project</h2>
        <p className="mt-2 text-sm text-slate">Use projects to separate blogs, docs, client sites, or brands.</p>
      </section>

      <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Project name</span>
            <input
              className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              name="name"
              placeholder="Company blog"
              type="text"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Slug</span>
            <input
              className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              name="slug"
              placeholder="company-blog"
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              minLength={2}
              maxLength={80}
              required
            />
            <span className="text-xs text-slate">Lowercase letters, numbers, and hyphens only.</span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Description</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-lg border border-cloud bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              name="description"
              placeholder="What this project is used for."
              maxLength={280}
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
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Link
          href="/dashboard/settings"
          className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="h-10 rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}
