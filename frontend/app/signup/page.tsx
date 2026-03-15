import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account."
      description="Use your email, name, password and phone number to start renting."
    >
      <SignUpForm />
    </AuthShell>
  );
}
