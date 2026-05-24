"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

const statuses = [
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" }
];

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function EditPostPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const { activeProject } = useProjects();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorProfilePic, setAuthorProfilePic] = useState("");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts/${params.postId}`, {
          credentials: "include"
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error?.message ?? "Unable to load post.");
        }

        if (active) {
          setTitle(data.post.title ?? "");
          setSlug(data.post.slug ?? "");
          setExcerpt(data.post.excerpt ?? "");
          setContent(data.post.content ?? "");
          setStatus(normalizeStatus(data.post.status ?? "draft"));
          setCategory(data.post.category ?? "");
          setAuthorName(data.post.authors?.[0]?.name ?? "");
          setAuthorProfilePic(data.post.authors?.[0]?.profilePic ?? "");
          setTags(Array.isArray(data.post.tags) ? data.post.tags.join(", ") : "");
          setSeoTitle(data.post.seoTitle ?? "");
          setSeoDescription(data.post.seoDescription ?? "");
          setPublishDate(data.post.publishedAt ? String(data.post.publishedAt).slice(0, 10) : "");
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load post.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [activeProject.id, params.postId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts/${params.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          status,
          category,
          authorName,
          authorProfilePic,
          tags: splitTags(tags),
          publishDate,
          seoTitle,
          seoDescription
        })
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to update post.");
        return;
      }

      router.push(`/dashboard/posts/${params.postId}`);
      router.refresh();
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <form className="mx-auto max-w-5xl space-y-6" onSubmit={handleSubmit}>
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Posts</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Edit post</h2>
            <p className="mt-2 text-sm text-slate">Update this post in {activeProject.name}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/posts/${params.postId}`} className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink">
              Cancel
            </Link>
            <button type="submit" className="h-10 rounded-lg bg-coral px-4 text-sm font-semibold text-white disabled:opacity-70" disabled={saving || loading}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}
        {loading ? <p className="rounded-lg border border-cloud bg-white p-4 text-sm text-slate">Loading post...</p> : null}

        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4 rounded-lg border border-cloud bg-white p-4 shadow-sm">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Title</span>
              <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Slug</span>
              <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={slug} onChange={(event) => setSlug(event.target.value)} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Excerpt</span>
              <textarea className="min-h-24 w-full rounded-lg border border-cloud px-3 py-2 text-sm outline-none" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Content</span>
              <textarea className="min-h-[360px] w-full rounded-lg border border-cloud px-3 py-2 text-sm leading-7 outline-none" value={content} onChange={(event) => setContent(event.target.value)} />
            </label>
          </div>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Publishing</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Status</span>
                  <select className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={status} onChange={(event) => setStatus(event.target.value)}>
                    {statuses.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Publish date</span>
                  <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" type="date" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Category</span>
                  <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={category} onChange={(event) => setCategory(event.target.value)} />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Author name</span>
                  <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={authorName} onChange={(event) => setAuthorName(event.target.value)} />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Author profile image</span>
                  <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" type="url" value={authorProfilePic} onChange={(event) => setAuthorProfilePic(event.target.value)} />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Tags</span>
                  <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" value={tags} onChange={(event) => setTags(event.target.value)} />
                </label>
              </div>
            </section>
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">SEO</h3>
              <div className="mt-4 space-y-4">
                <input className="h-10 w-full rounded-lg border border-cloud px-3 text-sm outline-none" placeholder="Meta title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
                <textarea className="min-h-24 w-full rounded-lg border border-cloud px-3 py-2 text-sm outline-none" placeholder="Meta description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
              </div>
            </section>
          </aside>
        </section>
      </form>
    </main>
  );
}
