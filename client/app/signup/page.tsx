import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell>
      <section className="rounded-xl border border-cloud bg-white/85 p-6 shadow-soft backdrop-blur">
        <div className="mb-6">
          <BrandLogo size="md" />
          <h1 className="mt-6 text-2xl font-semibold text-ink">Create account</h1>
          <p className="mt-2 text-sm text-slate">Start with email and password.</p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-slate">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink">
            Sign in
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
