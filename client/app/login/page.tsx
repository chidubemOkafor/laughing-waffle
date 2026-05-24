import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <section className="rounded-xl border border-cloud bg-white/85 p-6 shadow-soft backdrop-blur">
        <div className="mb-6">
          <BrandLogo size="md" />
          <h1 className="mt-6 text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-slate">Use your email and password to continue.</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate">
          No account?{" "}
          <Link href="/signup" className="font-semibold text-ink">
            Create one
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
