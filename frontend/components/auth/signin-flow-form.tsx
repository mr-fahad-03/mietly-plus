"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { checkEmailExists, requestSignUpOtp, signIn, verifySignUpOtp } from "@/lib/api";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type Step = "email" | "password" | "signup";

function normalizeGermanNumberInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13);
}

export function SignInFlowForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const exists = await checkEmailExists(email.trim());
      setStep(exists ? "password" : "signup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const payload = await signIn({ email: email.trim(), password: password.trim() });
      localStorage.setItem("user_token", payload.token);
      setMessage("Signed in successfully.");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (!signupOtpSent) {
        const payload = await requestSignUpOtp({
          email: email.trim(),
          name: name.trim(),
          password: password.trim(),
          phone: phone.trim() ? `+49${phone.trim()}` : undefined,
        });
        setSignupOtpSent(true);
        setMessage(`Verification code sent to ${payload.email}.`);
      } else {
        const payload = await verifySignUpOtp({
          email: email.trim(),
          otp: otp.trim(),
        });
        localStorage.setItem("user_token", payload.token);
        setMessage("Account created successfully.");
        setOtp("");
        setSignupOtpSent(false);
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 p-1 text-[11px] font-semibold text-zinc-500">
        <span
          className={`rounded-full px-2.5 py-1 ${
            step === "email" ? "bg-[rgb(73,153,173)] text-white" : "bg-transparent"
          }`}
        >
          Email
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            step === "password" ? "bg-[rgb(73,153,173)] text-white" : "bg-transparent"
          }`}
        >
          Login
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            step === "signup" ? "bg-[rgb(73,153,173)] text-white" : "bg-transparent"
          }`}
        >
          Signup
        </span>
      </div>

      {step === "email" ? (
        <form
          onSubmit={onContinue}
          className="space-y-4 rounded-2xl border border-[rgba(73,153,173,0.22)] bg-white p-4 shadow-[0_14px_32px_-24px_rgba(73,153,173,0.5)]"
        >
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full rounded-lg bg-transparent px-2 py-2 text-[15px] text-zinc-800 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[rgb(73,153,173)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgb(60,138,158)]"
          >
            {loading ? "Checking..." : "Continue with email"}
          </button>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-zinc-200" />
            <span>or sign in with</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <GoogleAuthButton />
        </form>
      ) : null}

      {step === "password" ? (
        <form
          onSubmit={onLogin}
          className="space-y-3 rounded-2xl border border-[rgba(73,153,173,0.22)] bg-white p-4 shadow-[0_14px_32px_-24px_rgba(73,153,173,0.5)]"
        >
          <p className="text-sm text-zinc-600">
            Account found for <span className="font-medium">{email}</span>
          </p>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[rgb(73,153,173)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgb(60,138,158)]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="text-sm font-medium text-zinc-600 underline"
          >
            Use another email
          </button>
        </form>
      ) : null}

      {step === "signup" ? (
        <form
          onSubmit={onCreate}
          className="space-y-3 rounded-2xl border border-[rgba(73,153,173,0.22)] bg-white p-4 shadow-[0_14px_32px_-24px_rgba(73,153,173,0.5)]"
        >
          <p className="text-sm text-zinc-600">No account found. Complete details to create one.</p>
          <input
            type="text"
            required={!signupOtpSent}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            disabled={signupOtpSent}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
          />
          <input
            type="password"
            required={!signupOtpSent}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            disabled={signupOtpSent}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
          />
          <div className="flex overflow-hidden rounded-xl border border-zinc-200 focus-within:border-[rgb(73,153,173)]">
            <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-3 text-[15px] text-zinc-700">
              +49
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(normalizeGermanNumberInput(e.target.value))}
              placeholder="15123456789"
              disabled={signupOtpSent}
              className="w-full px-3 py-2.5 text-[15px] outline-none"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Germany numbers only. Country code is fixed to +49.
          </p>
          {signupOtpSent ? (
            <input
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
            />
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[rgb(73,153,173)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgb(60,138,158)]"
          >
            {loading ? "Please wait..." : signupOtpSent ? "Verify OTP & Create Account" : "Send OTP"}
          </button>
          {signupOtpSent ? (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setMessage("");
                setError("");
                try {
                  const payload = await requestSignUpOtp({
                    email: email.trim(),
                    name: name.trim(),
                    password: password.trim(),
                    phone: phone.trim() ? `+49${phone.trim()}` : undefined,
                  });
                  setMessage(`New verification code sent to ${payload.email}.`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not resend OTP.");
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Resend OTP
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setSignupOtpSent(false);
              setOtp("");
            }}
            className="text-sm font-medium text-zinc-600 underline"
          >
            Back
          </button>
        </form>
      ) : null}

      {message ? <p className="text-sm font-medium text-[rgb(47,118,135)]">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <p className="text-sm text-zinc-700">
        New user?{" "}
        <Link
          href="/signup"
          className="font-semibold text-zinc-900 underline decoration-[rgb(73,153,173)]"
        >
          Open full signup page
        </Link>
      </p>
    </div>
  );
}
