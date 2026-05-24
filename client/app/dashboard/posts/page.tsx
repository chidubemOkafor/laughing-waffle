"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

type PostFilter = "all" | "published" | "draft" | "review" | "scheduled";

type ManagedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  category: string | null;
  authors: Array<{
    name: string;
    profilePic: string | null;
  }>;
  readTimeMinutes: number;
  updated: string;
  thumbnail: {
    url: string;
    alt: string | null;
  } | null;
};

const filterOptions: Array<{ label: string; value: PostFilter }> = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Scheduled", value: "scheduled" }
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Published: "bg-[rgba(35,184,169,0.12)] text-[#127b72]",
    Review: "bg-[rgba(244,183,64,0.16)] text-[#875f08]",
    Draft: "bg-cloud text-slate",
    Scheduled: "bg-[rgba(91,141,239,0.14)] text-[#315fa7]"
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-paper text-slate"}`}>
      {status}
    </span>
  );
}

export default function PostsPage() {
  const { activeProject } = useProjects();
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [status, setStatus] = useState<PostFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeletePost, setPendingDeletePost] = useState<ManagedPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          status,
          search
        });
        const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts?${params.toString()}`, {
          credentials: "include"
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error?.message ?? "Unable to load posts.");
        }

        if (active) {
          setPosts(Array.isArray(data.posts) ? data.posts : []);
        }
      } catch (caughtError) {
        if (active) {
          setPosts([]);
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load posts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeProject.id, search, status]);

  async function deletePost() {
    if (!pendingDeletePost) {
      return;
    }

    setError("");
    setDeletingId(pendingDeletePost.id);

    try {
      const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/posts/${pendingDeletePost.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Unable to delete post.");
      }

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== pendingDeletePost.id));
      setPendingDeletePost(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete post.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Posts</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Manage posts</h2>
            <p className="mt-2 text-sm text-slate">Live posts for {activeProject.name}.</p>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
          >
            Create post
          </Link>
        </div>

        <section className="grid min-w-0 gap-3 rounded-lg border border-cloud bg-white p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="block">
            <span className="sr-only">Search posts</span>
            <input
              className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              placeholder="Search by title, slug, excerpt, or category..."
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="sr-only">Filter status</span>
            <select
              className="h-10 w-full rounded-lg border border-cloud bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              value={status}
              onChange={(event) => setStatus(event.target.value as PostFilter)}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}

        <section className="rounded-lg border border-cloud bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_180px] gap-4 border-b border-cloud px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate max-lg:hidden">
            <span>Title</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-cloud">
            {posts.map((post) => (
              <div key={post.id} className="grid min-w-0 gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_120px_120px_180px] lg:items-center">
                <div className="flex items-center gap-3">
                  {post.thumbnail ? (
                    <img
                      className="h-14 w-20 flex-shrink-0 rounded-md border border-cloud object-cover"
                      src={post.thumbnail.url}
                      alt={post.thumbnail.alt ?? ""}
                    />
                  ) : (
                    <div className="grid h-14 w-20 flex-shrink-0 place-items-center rounded-md border border-cloud bg-paper text-[10px] font-semibold uppercase tracking-[0.12em] text-slate">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{post.title}</p>
                    <p className="mt-1 text-sm text-slate">
                      {post.category || "Uncategorized"} · {post.readTimeMinutes} min read · {post.authors[0]?.name || "No author"} · /{post.slug}
                    </p>
                  </div>
                </div>
                <StatusBadge status={post.status} />
                <span className="text-sm text-slate">{post.updated}</span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/posts/${post.id}` as Route}
                    className="inline-flex h-9 items-center rounded-lg border border-cloud px-3 text-sm font-semibold text-ink transition hover:border-slate/40"
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/dashboard/posts/${post.id}/edit` as Route}
                    className="inline-flex h-9 items-center rounded-lg border border-cloud px-3 text-sm font-semibold text-ink transition hover:border-slate/40"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-[rgba(255,107,90,0.28)] px-3 text-sm font-semibold text-[#b83628] transition hover:bg-[rgba(255,107,90,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === post.id}
                    onClick={() => setPendingDeletePost(post)}
                  >
                    {deletingId === post.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}

            {!loading && posts.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <h3 className="text-base font-semibold text-ink">No posts found</h3>
                <p className="mt-2 text-sm text-slate">
                  {search || status !== "all"
                    ? "Try changing your search or status filter."
                    : "Create your first post for this project to see it here."}
                </p>
                <Link
                  href="/dashboard/posts/new"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
                >
                  Create post
                </Link>
              </div>
            ) : null}

            {loading ? <div className="px-4 py-8 text-center text-sm text-slate">Loading live posts...</div> : null}
          </div>
        </section>
      </div>

      {pendingDeletePost ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-8 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-cloud bg-white p-5 shadow-soft">
            <div className="rounded-full bg-[rgba(255,107,90,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b83628]">
              Delete post
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink">Delete this post?</h3>
            <p className="mt-2 text-sm leading-6 text-slate">
              <span className="font-semibold text-ink">{pendingDeletePost.title}</span> will be removed from this project. This is a soft delete.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
                disabled={deletingId === pendingDeletePost.id}
                onClick={() => setPendingDeletePost(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-[#b83628] px-4 text-sm font-semibold text-white transition hover:bg-[#9f2e23] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deletingId === pendingDeletePost.id}
                onClick={deletePost}
              >
                {deletingId === pendingDeletePost.id ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
