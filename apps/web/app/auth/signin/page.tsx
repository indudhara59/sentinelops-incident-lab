import { ShieldCheck } from "lucide-react";
import { signIn } from "@/auth";
import {
  authenticationConfigured,
  safeRedirectTarget,
} from "@/lib/auth/config";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeRedirectTarget(params.callbackUrl);
  const configured = authenticationConfigured();

  return (
    <main id="main-content" className="dashboard-shell auth-shell">
      <section
        className="dashboard-card auth-card"
        aria-labelledby="signin-title"
      >
        <ShieldCheck size={32} aria-hidden="true" />
        <p className="eyebrow">Secure account access</p>
        <h1 id="signin-title">Sign in to SentinelOps</h1>
        <p>
          Google sign-in protects your saved investigations and reports.
          SentinelOps never stores a password.
        </p>
        {params.error ? (
          <p className="status-banner status-error" role="alert">
            Sign-in could not be completed. Try again or contact the deployment
            owner.
          </p>
        ) : null}
        {configured ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button className="button" type="submit">
              Continue with Google
            </button>
          </form>
        ) : (
          <div className="status-banner" role="status">
            Authentication is unavailable in this deployment. Public simulations
            remain available, but investigations cannot be saved.
          </div>
        )}
      </section>
    </main>
  );
}
