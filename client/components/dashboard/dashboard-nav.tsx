"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Key, BookOpen, CreditCard, FolderPlus, Settings } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/logout-button";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    label: "Content",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/posts", label: "Posts", icon: FileText }
    ]
  },
  {
    label: "Developer",
    items: [
      { href: "/dashboard/api-keys", label: "API keys", icon: Key },
      { href: "/dashboard/docs", label: "Docs", icon: BookOpen }
    ]
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/projects/new", label: "New project", icon: FolderPlus },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings }
    ]
  }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

const flatItems = navSections.flatMap((s) => s.items);

export function DashboardNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  if (compact) {
    return (
      <nav className="flex gap-1 overflow-x-auto px-4 py-3 sm:px-6 lg:hidden">
        {flatItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-ink text-white" : "text-slate hover:bg-cloud/60 hover:text-ink"
              ].join(" ")}
            >
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <LogoutButton compact />
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-5 px-3 py-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/50">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-ink text-white" : "text-slate hover:bg-cloud/60 hover:text-ink"
                  ].join(" ")}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
