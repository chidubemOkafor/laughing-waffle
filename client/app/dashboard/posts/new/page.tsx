"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
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
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<"draft" | "publish" | null>(null);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish">("publish");
  const submitIntentRef = useRef<"draft" | "publish">("publish");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = submitIntentRef.current;
    setError("");
    setLoadingAction(action);

    const formData = new FormData(event.currentTarget);
    const nextStatus = action === "publish" ? "published" : status;

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          slug,
          excerpt: formData.get("excerpt"),
          content: formData.get("content"),
          status: nextStatus,
          category: formData.get("category"),
          authorName: formData.get("authorName"),
          authorProfilePic: formData.get("authorProfilePic"),
          tags: splitTags(tags),
          publishDate: formData.get("publishDate"),
          thumbnailUrl,
          thumbnailAlt: formData.get("thumbnailAlt"),
          seoTitle: formData.get("seoTitle"),
          seoDescription: formData.get("seoDescription")
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to create post.");
        return;
      }

      router.push("/dashboard/posts");
      router.refresh();
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 4000.");
    } finally {
      setLoadingAction(null);
    }
  }

  function insertContent(before: string, after = "", fallback = "") {
    const textarea = contentRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);
    const text = selectedText || fallback;
    const nextValue = `${textarea.value.slice(0, start)}${before}${text}${after}${textarea.value.slice(end)}`;
    const cursorPosition = start + before.length + text.length + after.length;

    textarea.value = nextValue;
    textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  }

  function insertParagraph() {
    insertContent("\n\n", "", "New paragraph");
  }

  function insertLink() {
    insertContent("[", "](https://example.com)", "link text");
  }

  function insertImage() {
    insertContent("![", "](https://example.com/image.jpg)", "image alt text");
  }

  function insertQuote() {
    insertContent("\n> ", "", "Quote text");
  }

  function insertCode() {
    insertContent("\n```\n", "\n```\n", "code goes here");
  }

  async function uploadImage(file: File, usage: "thumbnail" | "post-image") {
    setError("");
    setUploading(usage);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("usage", usage);

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/media`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error?.message ?? "Unable to upload image.");
        return null;
      }

      return data.media as { url: string; alt: string | null };
    } catch {
      setError("Unable to upload image. Make sure Cloudinary is configured and the backend is running.");
      return null;
    } finally {
      setUploading("");
    }
  }

  async function handleThumbnailUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const media = await uploadImage(file, "thumbnail");

    if (media?.url) {
      setThumbnailUrl(media.url);
    }
  }

  async function handleBodyImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const media = await uploadImage(file, "post-image");

    if (media?.url) {
      insertContent("![", `](${media.url})`, media.alt || "Uploaded image");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <form className="mx-auto max-w-7xl space-y-6" onSubmit={submitPost}>
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Posts</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Create post</h2>
            <p className="mt-2 text-sm text-slate">Create a live post inside {activeProject.name}.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/posts"
              className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="h-10 rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={Boolean(loadingAction)}
              onClick={() => {
                submitIntentRef.current = "draft";
                setSubmitIntent("draft");
              }}
            >
              {loadingAction === "draft" ? "Saving..." : "Save draft"}
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={Boolean(loadingAction)}
              onClick={() => {
                submitIntentRef.current = "publish";
                setSubmitIntent("publish");
              }}
            >
              {loadingAction === "publish" ? "Publishing..." : "Publish"}
            </button>
          </div>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <div className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Title</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    placeholder="Untitled post"
                    type="text"
                    value={title}
                    onChange={(event) => handleTitleChange(event.target.value)}
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
                    onChange={(event) => {
                      setSlugEdited(true);
                      setSlug(slugify(event.target.value));
                    }}
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
            </div>

            <div className="rounded-lg border border-cloud bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-cloud px-4 py-3">
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={insertParagraph}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={() => insertContent("**", "**", "bold text")}
                >
                  Bold
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={() => insertContent("_", "_", "italic text")}
                >
                  Italic
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={insertLink}
                >
                  Link
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={insertImage}
                >
                  Image
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={insertQuote}
                >
                  Quote
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-cloud px-2.5 text-xs font-semibold text-slate transition hover:border-slate/40 hover:text-ink"
                  onClick={insertCode}
                >
                  Code
                </button>
              </div>
              <label className="block">
                <span className="sr-only">Post content</span>
                <textarea
                  ref={contentRef}
                  className="min-h-[420px] w-full resize-y rounded-b-lg border-0 bg-white px-4 py-4 text-sm leading-7 outline-none placeholder:text-slate/60 focus:ring-0"
                  name="content"
                  placeholder="Write your post content here..."
                />
              </label>
            </div>
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Thumbnail</h3>
              <div className="mt-4 rounded-lg border border-dashed border-cloud bg-paper/70 p-4 text-center">
                {thumbnailUrl ? (
                  <img
                    className="mx-auto h-28 max-w-44 rounded-md border border-cloud object-cover"
                    src={thumbnailUrl}
                    alt=""
                  />
                ) : (
                  <div className="mx-auto grid h-28 max-w-44 place-items-center rounded-md border border-cloud bg-white">
                    <span className="text-sm font-medium text-slate">No image</span>
                  </div>
                )}
                <p className="mt-3 text-sm text-slate">Used for post cards, previews, and API consumers.</p>
                <label className="mt-4 block space-y-2 text-left">
                  <span className="text-sm font-medium text-ink">Thumbnail URL</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    value={thumbnailUrl}
                    onChange={(event) => setThumbnailUrl(event.target.value)}
                  />
                </label>
                <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40">
                  {uploading === "thumbnail" ? "Uploading..." : "Upload thumbnail"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    disabled={Boolean(uploading)}
                    onChange={(event) => handleThumbnailUpload(event.target.files?.[0])}
                  />
                </label>
                <label className="mt-4 block space-y-2 text-left">
                  <span className="text-sm font-medium text-ink">Thumbnail alt text</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="thumbnailAlt"
                    placeholder="Describe the image"
                    type="text"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Publishing</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Status</span>
                  <select
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    {statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Publish date</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="publishDate"
                    type="date"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Category</span>
                  <select
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="category"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Author</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Author name</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="authorName"
                    placeholder="Ada Lovelace"
                    type="text"
                    maxLength={120}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Profile image URL</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="authorProfilePic"
                    placeholder="https://example.com/author.jpg"
                    type="url"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Tags</h3>
              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-ink">Add tags</span>
                <input
                  className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                  placeholder="cms, api, editorial"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {splitTags(tags).map((tag) => (
                  <span key={tag} className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-slate">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">Post images</h3>
              <div className="mt-4 rounded-lg border border-dashed border-cloud bg-paper/70 p-4">
                <label className="flex h-20 cursor-pointer items-center justify-center rounded-md border border-cloud bg-white text-sm font-semibold text-ink transition hover:border-slate/40">
                  {uploading === "post-image" ? "Uploading..." : "Upload and insert image"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    disabled={Boolean(uploading)}
                    onChange={(event) => handleBodyImageUpload(event.target.files?.[0])}
                  />
                </label>
                <p className="mt-3 text-sm leading-6 text-slate">Uploaded images are inserted into the body as markdown image links.</p>
              </div>
            </section>

            <section className="rounded-lg border border-cloud bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-ink">SEO</h3>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Meta title</span>
                  <input
                    className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="seoTitle"
                    placeholder="Title shown in search"
                    type="text"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink">Meta description</span>
                  <textarea
                    className="min-h-24 w-full resize-y rounded-lg border border-cloud bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
                    name="seoDescription"
                    placeholder="Description shown in search previews."
                    maxLength={280}
                  />
                </label>
              </div>
            </section>
          </aside>
        </section>
      </form>
    </main>
  );
}
