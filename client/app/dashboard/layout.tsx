import type { ReactNode } from "react";
import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { BrandLogo } from "@/components/brand-logo";
import { ApiUsageCard } from "@/components/dashboard/api-usage-card";
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { ProjectProvider } from "@/components/dashboard/project-context";
import { ProjectSwitcher } from "@/components/dashboard/project-switcher";

export default function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <DashboardAuthGate>
      <ProjectProvider>
        <div className="min-h-screen bg-paper text-ink">
          <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
            <aside className="hidden border-r border-cloud bg-white/75 lg:flex lg:flex-col">
              <div className="flex h-16 items-center border-b border-cloud px-5">
                <BrandLogo href="/dashboard" />
              </div>

              <DashboardNav />
              <div className="mt-auto">
                <ApiUsageCard />
                <div className="border-t border-cloud px-3 py-3">
                  <LogoutButton />
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <header className="sticky top-0 z-20 border-b border-cloud bg-paper/90 backdrop-blur">
                <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
                  <ProjectSwitcher />

                  <DashboardHeaderActions />
                </div>
              </header>

              <div className="border-b border-cloud bg-white/70 lg:hidden">
                <DashboardNav compact />
              </div>

              {children}
            </div>
          </div>
        </div>
      </ProjectProvider>
    </DashboardAuthGate>
  );
}
