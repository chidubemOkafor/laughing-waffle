import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { plans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,90,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(91,141,239,0.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-14 flex flex-wrap items-center justify-between gap-3">
            <BrandLogo />
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-slate transition hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
              >
                Start free
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coral">Pricing</p>
            <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-ink sm:text-6xl">
              Start simple, charge when your content API matters.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate">
              LaughingWaffle plans are built around the things that actually cost money: projects, posts, API
              requests, and image storage.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "relative rounded-3xl border p-6 shadow-sm",
                plan.featured ? "border-coral bg-white shadow-[0_24px_70px_rgba(16,19,24,0.12)]" : "border-cloud bg-white/75"
              ].join(" ")}
            >
              {plan.badge ? (
                <span className="absolute right-5 top-5 rounded-full bg-[rgba(255,107,90,0.12)] px-3 py-1 text-xs font-bold text-coral">
                  {plan.badge}
                </span>
              ) : null}
              <p className="text-sm font-semibold text-slate">{plan.audience}</p>
              <h2 className="mt-3 text-2xl font-bold text-ink">{plan.name}</h2>
          <div className="mt-5 flex flex-wrap items-end gap-2">
                <span className="text-4xl font-black sm:text-5xl">{plan.price}</span>
                <span className="pb-2 text-sm font-medium text-slate">{plan.period}</span>
              </div>
              <p className="mt-4 min-h-16 text-sm leading-6 text-slate">{plan.description}</p>

              <Link
                href="/signup"
                className={[
                  "mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition",
                  plan.featured
                    ? "bg-coral text-white hover:bg-[#ef5a49]"
                    : "border border-cloud bg-paper text-ink hover:border-slate/40"
                ].join(" ")}
              >
                {plan.cta}
              </Link>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {plan.limits.map((limit) => (
                  <div key={limit.label} className="rounded-2xl border border-cloud bg-paper/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">{limit.label}</p>
                    <p className="mt-1 text-sm font-bold text-ink">{limit.value}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-slate">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
