import { AuthShell } from "@/components/auth/auth-shell";
import { SignInFlowForm } from "@/components/auth/signin-flow-form";

export default function SignInPage() {
  return (
    <AuthShell
      title="Glad to have you here."
      description="Sign in with your email. If account exists we ask password, otherwise we guide you to create one."
    >
      <SignInFlowForm />
    </AuthShell>
  );
}
