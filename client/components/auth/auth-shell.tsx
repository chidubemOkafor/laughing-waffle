import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,107,90,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(91,141,239,0.16),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(35,184,169,0.10),transparent_35%)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
