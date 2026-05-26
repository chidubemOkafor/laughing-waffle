import Link from "next/link";
import { ProjectSettingsPanel } from "@/components/dashboard/project-settings-panel";
import { ProjectMembersPanel } from "@/components/dashboard/project-members-panel";

export default function SettingsPage() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Settings</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Workspace and projects</h2>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
          >
            New project
          </Link>
        </section>

        <ProjectSettingsPanel />
        <ProjectMembersPanel />
      </div>
    </main>
  );
}
