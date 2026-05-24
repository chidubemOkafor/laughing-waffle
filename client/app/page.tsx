import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="relative overflow-hidden px-4 pt-10 pb-24 sm:px-6 lg:px-8">
        <div className="animate-ambient-drift absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_18%_16%,rgba(255,107,90,0.18),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(91,141,239,0.14),transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="animate-fade-rise flex flex-wrap items-center justify-between gap-3">
            <BrandLogo />
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="hidden text-sm font-semibold text-slate transition hover:text-ink sm:inline"
              >
                Pricing
              </Link>
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

          <div className="animate-fade-rise animation-delay-100 mt-20 max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-7xl">
              Publish the blog.
              <br />
              Keep the API clean.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate">
              Write posts, upload images, generate a key. Your app fetches the content — nothing else ships with it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-xl bg-coral px-6 text-sm font-bold text-white transition hover:bg-[#ef5a49]"
              >
                Start free
              </Link>
              <Link href="/pricing" className="text-sm font-semibold text-slate transition hover:text-ink">
                See plans →
              </Link>
            </div>
          </div>

          <div className="animate-fade-rise animation-delay-300 mt-14 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-ink shadow-[0_24px_70px_rgba(16,19,24,0.16)]">
            <div className="border-b border-white/8 px-6 py-3">
              <p className="font-mono text-xs uppercase tracking-widest text-white/35">
                GET /api/v1/projects/blog/posts
              </p>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-sm leading-6 text-white/75">
{`[
  {
    "id": "clv4x...",
    "title": "Launch notes — May 2025",
    "slug":  "launch-notes-may-2025",
    "content": "Markdown body...",
    "thumbnail": "https://res.cloudinary.com/...",
    "tags": ["product", "updates"],
    "publishedAt": "2025-05-12T09:00:00Z"
  }
]`}
            </pre>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-start lg:gap-20">
            <div>
              <h2 className="font-display text-3xl font-black leading-tight text-ink sm:text-4xl">
                An editor that does not fight you.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate">
                Write in Markdown. Attach a thumbnail. Add tags. Publish or save as draft. That is the whole editor
                — no block widgets, no page builder config, no CMS settings to survive.
              </p>
              <p className="mt-4 text-base leading-7 text-slate">
                Images go to Cloudinary. Content goes to the API. Your frontend gets clean structured data it can
                actually use.
              </p>
            </div>

            <div className="space-y-8 lg:pt-1">
              <div>
                <h3 className="text-base font-bold text-ink">One account, separate projects</h3>
                <p className="mt-2 text-sm leading-6 text-slate">
                  Keep a product blog, a changelog, and a client site under one login. Each project has its own API
                  endpoint and its own keys.
                </p>
              </div>
              <div className="border-t border-cloud pt-8">
                <h3 className="text-base font-bold text-ink">Scoped API keys</h3>
                <p className="mt-2 text-sm leading-6 text-slate">
                  Issue a{" "}
                  <code className="rounded bg-cloud px-1.5 py-0.5 font-mono text-xs text-ink">content:read</code>{" "}
                  key for your frontend and a{" "}
                  <code className="rounded bg-cloud px-1.5 py-0.5 font-mono text-xs text-ink">content:write</code>{" "}
                  key for automation. Revoke either without touching the other.
                </p>
              </div>
              <div className="border-t border-cloud pt-8">
                <h3 className="text-base font-bold text-ink">No page-builder payload</h3>
                <p className="mt-2 text-sm leading-6 text-slate">
                  The response is flat: title, slug, content, thumbnail, tags, author. Your app uses it directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink text-white">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral">For developers</p>
              <h2 className="mt-4 font-display text-2xl font-black leading-tight sm:text-3xl">
                The content endpoint is the product.
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Keep editors in LaughingWaffle. Keep your app in your codebase. One authenticated GET returns
                everything you need — no GraphQL schema, no client SDK.
              </p>
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-xs leading-6 text-white/70">
{`fetch("https://api.laughingwaffle.online/api/v1/projects/blog/posts", {
  headers: { Authorization: "Bearer lw_live_..." }
})
  .then(r => r.json())
  .then(posts => {
    // flat array — use it however you want
  })`}
            </pre>
          </div>
        </div>
      </section>

      <section className="px-4 pb-28 pt-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
            If it feels too heavy, it is not doing its job.
          </h2>
          <p className="mt-4 text-sm text-slate">No card required. One real post is enough to know.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl bg-coral px-6 text-sm font-bold text-white transition hover:bg-[#ef5a49]"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-cloud bg-paper px-6 text-sm font-bold text-ink transition hover:border-slate/40"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
