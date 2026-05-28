import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <section className="rounded-xl border border-cloud bg-white/85 dark:bg-[#1a1d26]/90 p-6 shadow-soft backdrop-blur">
        <div className="mb-6">
          <BrandLogo size="md" />
          <h1 className="mt-6 text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-2 text-sm text-slate">Enter your email and we will send you a secure reset link.</p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-slate">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-ink">
            Sign in
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
