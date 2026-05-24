import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-16 text-ink">
      <div className="animate-ambient-drift absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_20%_16%,rgba(255,107,90,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(91,141,239,0.16),transparent_32%)]" />

      <section className="animate-fade-rise relative w-full max-w-2xl rounded-[2rem] border border-cloud bg-white/85 p-6 text-center shadow-[0_24px_70px_rgba(16,19,24,0.10)] backdrop-blur sm:p-10">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-coral">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">This page wandered off.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate sm:text-base">
          The route you opened does not exist in LaughingWaffle. It may have moved, been deleted, or never been created.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-coral px-5 text-sm font-bold text-white transition hover:bg-[#ef5a49]"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-cloud bg-paper px-5 text-sm font-bold text-ink transition hover:border-slate/40"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
