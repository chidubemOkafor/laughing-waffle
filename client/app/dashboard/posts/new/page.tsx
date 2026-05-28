"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { PostEditor } from "@/components/dashboard/post-editor";
import { API_URL } from "@/lib/api";

const categories = ["Product", "Editorial", "Developers", "Company"];
const statuses = [
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function NewPostPage() {
  const router = useRouter();
  const { activeProject } = useProjects();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [authorProfilePic, setAuthorProfilePic] = useState("");
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function uploadMedia(file: File, usage: string): Promise<{ url: string; alt: string | null } | null> {
    setError("");
    setUploading(usage);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("usage", usage);
    try {
      const res = await fetch(`${API_URL}/api/projects/${activeProject.id}/media`, {
        method: "POST",
        credentials: "include",
        body: fd
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error?.message ?? "Unable to upload image."); return null; }
      return data.media;
    } catch {
      setError("Unable to upload image.");
      return null;
    } finally {
      setUploading("");
    }
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) return;
    const media = await uploadMedia(file, "thumbnail");
    if (media?.url) setThumbnailUrl(media.url);
  }

  async function handleAuthorPicUpload(file: File | undefined) {
    if (!file) return;
    const media = await uploadMedia(file, "author-avatar");
    if (media?.url) setAuthorProfilePic(media.url);
  }

  async function handleBodyImageUpload(file: File): Promise<string | null> {
    const media = await uploadMedia(file, "post-image");
    return media?.url ?? null;
  }

  async function submitPost(event: FormEvent<HTMLFormElement>, intent: "draft" | "publish") {
    event.preventDefault();
    setError("");
    setSaving(intent);
    const formData = new FormData(event.currentTarget);
    const nextStatus = intent === "publish" ? "published" : status;

    try {
      const res = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          slug,
          excerpt: formData.get("excerpt"),
          content,
          status: nextStatus,
          category: formData.get("category"),
          authorName: formData.get("authorName"),
          authorProfilePic,
          tags: splitTags(tags),
          publishDate: formData.get("publishDate"),
          thumbnailUrl,
          thumbnailAlt: formData.get("thumbnailAlt"),
          seoTitle: formData.get("seoTitle"),
          seoDescription: formData.get("seoDescription")
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error?.message ?? "Unable to create post."); return; }
      router.push("/dashboard/posts");
      router.refresh();
    } catch {
      setError("Unable to reach the backend.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <form
        className="mx-auto max-w-7xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Posts</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Create post</h2>
            <p className="mt-2 text-sm text-slate">Create a live post inside {activeProject.name}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/posts" className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40">
              Cancel
            </Link>
            <button
              type="button"
              className="h-10 rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={Boolean(saving)}
              onClick={(e) => submitPost(e as unknown as FormEvent<HTMLFormElement>, "draft")}
            >
              {saving === "draft" ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={Boolean(saving)}
              onClick={(e) => submitPost(e as unknown as FormEvent<HTMLFormElement>, "publish")}
            >
              {saving === "publish" ? "Publishing..." : "Publish"}
            </button>
          </div>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <div className="rounded-lg border border-cloud bg-white p-4 shadow-sm space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Title</span>
                <input
                  className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                  placeholder="Untitled post"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  minLength={2}
                  maxLength={160}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Slug</span>
                <input
                  className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                  placeholder="untitled-post"
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink">Excerpt</span>
                <textarea
                  className="min-h-24 w-full resize-y rounded-lg border border-cloud bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                  name="excerpt"
                  placeholder="Short summary for previews, SEO, and API consumers."
                  maxLength={500}
                />
              </label>
            </div>

            <PostEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleBodyImageUpload}
              imageUploading={uploading === "post-image"}
            />
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Thumbnail</h3>
              <div className="mt-4 rounded-lg border border-dashed border-cloud bg-paper/70 p-4 text-center">
                {thumbnailUrl ? (
                  <img className="mx-auto h-28 max-w-44 rounded-md border border-cloud object-cover" src={thumbnailUrl} alt="" />
                ) : (
                  <div className="mx-auto grid h-28 max-w-44 place-items-center rounded-md border border-cloud bg-white">
                    <span className="text-sm font-medium text-slate">No image</span>
                  </div>
                )}
                <p className="mt-3 text-sm text-slate">Used for post cards and API consumers.</p>
                <label className="mt-3 block space-y-1.5 text-left">
                  <span className="text-xs font-medium text-ink">Thumbnail URL</span>
                  <input className="h-9 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" placeholder="https://…" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                </label>
                <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-cloud bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate/40">
                  {uploading === "thumbnail" ? "Uploading..." : "Upload from computer"}
                  <input className="sr-only" type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(e) => handleThumbnailUpload(e.target.files?.[0])} />
                </label>
                <label className="mt-3 block space-y-1.5 text-left">
                  <span className="text-xs font-medium text-ink">Alt text</span>
                  <input className="h-9 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="thumbnailAlt" placeholder="Describe the image" type="text" />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Publishing</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Status</span>
                  <select className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statuses.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Publish date</span>
                  <input className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="publishDate" type="date" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Category</span>
                  <select className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="category">
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Author</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Author name</span>
                  <input className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="authorName" placeholder="Ada Lovelace" type="text" maxLength={120} />
                </label>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-ink block">Profile image</span>
                  {authorProfilePic ? <img className="h-12 w-12 rounded-full border border-cloud object-cover" src={authorProfilePic} alt="" /> : null}
                  <input className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="authorProfilePic" placeholder="https://…" type="url" value={authorProfilePic} onChange={(e) => setAuthorProfilePic(e.target.value)} />
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-cloud bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate/40">
                    {uploading === "author-avatar" ? "Uploading..." : "Upload from computer"}
                    <input className="sr-only" type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(e) => handleAuthorPicUpload(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Tags</h3>
              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-ink">Add tags</span>
                <input className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" placeholder="cms, api, editorial" value={tags} onChange={(e) => setTags(e.target.value)} />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {splitTags(tags).map((tag) => (
                  <span key={tag} className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-slate">{tag}</span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">SEO</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Meta title</span>
                  <input className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="seoTitle" placeholder="Title shown in search" type="text" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Meta description</span>
                  <textarea className="min-h-24 w-full resize-y rounded-lg border border-cloud bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]" name="seoDescription" placeholder="Description shown in search previews." maxLength={280} />
                </label>
              </div>
            </section>
          </aside>
        </section>
      </form>
    </main>
  );
}
