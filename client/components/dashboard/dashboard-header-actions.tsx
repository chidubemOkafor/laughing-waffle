"use client";

import Link from "next/link";
import { useProjects } from "@/components/dashboard/project-context";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function DashboardHeaderActions() {
  const { projects } = useProjects();

  if (projects.length === 0) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Link
          href="/dashboard/projects/new"
          className="inline-flex h-10 shrink-0 items-center rounded-lg bg-coral px-3 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
        >
          Create project
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <ThemeToggle />
      <Link
        href="/dashboard/posts"
        className="hidden h-10 items-center rounded-lg border border-cloud bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate/40 sm:inline-flex"
      >
        View posts
      </Link>
      <Link
        href="/dashboard/posts/new"
        className="inline-flex h-10 items-center rounded-lg bg-coral px-3 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
      >
        New post
      </Link>
    </div>
  );
}
