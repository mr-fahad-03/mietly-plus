"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestSignUpOtp, verifySignUpOtp } from "@/lib/api";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

function normalizeGermanNumberInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13);
}

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (!otpStep) {
        const payload = await requestSignUpOtp({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() ? `+49${phone.trim()}` : undefined,
        });
        setOtpStep(true);
        setMessage(`Verification code sent to ${payload.email}.`);
      } else {
        const payload = await verifySignUpOtp({
          email: email.trim(),
          otp: otp.trim(),
        });
        localStorage.setItem("user_token", payload.token);
        setMessage("Account created successfully.");
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setOtp("");
        setOtpStep(false);
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
        <span className="rounded-full bg-[rgb(73,153,173)] px-2.5 py-1 text-white">Signup</span>
        <span className="rounded-full px-2.5 py-1">Account</span>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-[rgba(73,153,173,0.22)] bg-white p-4 shadow-[0_14px_32px_-24px_rgba(73,153,173,0.5)]"
      >
        <input
          required={!otpStep}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          disabled={otpStep}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          disabled={otpStep}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-[15px] outline-none focus:border-[rgb(73,153,173)]"
        />
        <input
          type="password"
          required={!otpStep}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create password"
          disabled={otpStep}
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
            disabled={otpStep}
            className="w-full px-3 py-2.5 text-[15px] outline-none"
          />
        </div>
        <p className="-mt-1 text-xs text-zinc-500">
          Germany numbers only. Country code is fixed to +49.
        </p>
        {otpStep ? (
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
          {loading ? "Please wait..." : otpStep ? "Verify OTP & Create Account" : "Send OTP"}
        </button>
        {otpStep ? (
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              setMessage("");
              try {
                const payload = await requestSignUpOtp({
                  name: name.trim(),
                  email: email.trim(),
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

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="h-px flex-1 bg-zinc-200" />
          <span>or continue with</span>
          <span className="h-px flex-1 bg-zinc-200" />
        </div>
        <GoogleAuthButton />
      </form>

      {message ? <p className="text-sm font-medium text-[rgb(47,118,135)]">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <p className="text-sm text-zinc-700">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-semibold text-zinc-900 underline decoration-[rgb(73,153,173)]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
