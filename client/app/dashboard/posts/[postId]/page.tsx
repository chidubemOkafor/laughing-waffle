"use client";

import Link from "next/link";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

type PostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  category: string | null;
  authors: Array<{
    name: string;
    profilePic: string | null;
  }>;
  readTimeMinutes: number;
  tags: string[];
  publishedAt: string | null;
  updated: string;
  thumbnail: {
    url: string;
    alt: string | null;
  } | null;
};

export default function PostPreviewPage() {
  const params = useParams<{ postId: string }>();
  const { activeProject } = useProjects();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
          setPost(data.post);
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

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Post preview</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">{post?.title ?? "Loading post..."}</h2>
            {post ? (
              <p className="mt-2 text-sm text-slate">
                /{post.slug} · {post.status} · {post.readTimeMinutes} min read · Updated {post.updated}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/posts" className="inline-flex h-10 items-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink">
              Back
            </Link>
            {post ? (
              <Link href={`/dashboard/posts/${post.id}/edit` as Route} className="inline-flex h-10 items-center rounded-lg bg-coral px-4 text-sm font-semibold text-white">
                Edit
              </Link>
            ) : null}
          </div>
        </section>

        {error ? <p className="rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p> : null}
        {loading ? <p className="rounded-lg border border-cloud bg-white p-4 text-sm text-slate">Loading live post...</p> : null}

        {post ? (
          <article className="overflow-hidden rounded-xl border border-cloud bg-white shadow-sm">
            {post.thumbnail ? <img src={post.thumbnail.url} alt={post.thumbnail.alt ?? ""} className="h-72 w-full object-cover" /> : null}
            <div className="space-y-5 p-6">
              <div>
                <p className="text-sm font-semibold text-coral">{post.category || "Uncategorized"}</p>
                <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{post.title}</h1>
                {post.authors.length > 0 ? (
                  <p className="mt-2 text-sm font-medium text-slate">
                    By {post.authors.map((author) => author.name).join(", ")}
                  </p>
                ) : null}
                {post.excerpt ? <p className="mt-3 text-lg leading-8 text-slate">{post.excerpt}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-slate">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-ink">{post.content || "No body content yet."}</div>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
