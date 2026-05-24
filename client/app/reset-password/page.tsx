import { BrandLogo } from "@/components/brand-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthShell>
      <section className="rounded-xl border border-cloud bg-white/85 p-6 shadow-soft backdrop-blur">
        <div className="mb-6">
          <BrandLogo size="md" />
          <h1 className="mt-6 text-2xl font-semibold text-ink">Create a new password</h1>
          <p className="mt-2 text-sm text-slate">Choose a new password for your account.</p>
        </div>

        <ResetPasswordForm token={resolvedSearchParams.token ?? ""} />
      </section>
    </AuthShell>
  );
}
