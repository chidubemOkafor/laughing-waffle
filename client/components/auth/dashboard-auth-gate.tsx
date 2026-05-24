"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { API_URL } from "@/lib/api";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      setChecking(true);

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include"
        });

        if (!response.ok) {
          const next = encodeURIComponent(pathname || "/dashboard");
          router.replace(`/login?next=${next}`);
          return;
        }

        const data = await response.json();
        const user = data?.user;

        if (!cancelled) {
          if (user?.id) {
            posthog.identify(user.id, { email: user.email, name: user.name });
          }
          setAuthorized(true);
        }
      } catch {
        const next = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/login?next=${next}`);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking || !authorized) {
    return null;
  }

  return <>{children}</>;
}
