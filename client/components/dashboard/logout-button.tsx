"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/api";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className={[
        compact
          ? "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate transition hover:bg-cloud/60 hover:text-ink"
          : "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate transition hover:bg-cloud/60 hover:text-ink",
        loading ? "cursor-not-allowed opacity-60" : ""
      ].join(" ")}
      disabled={loading}
      onClick={handleLogout}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
