"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signInWithGoogle } from "@/lib/api";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services-script";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Google script.")), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Could not load Google script."));
    document.head.appendChild(script);
  });
}

export function GoogleAuthButton() {
  const router = useRouter();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [booting, setBooting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = String(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
    let active = true;

    if (!clientId) {
      setBooting(false);
      setError("Google Sign-In is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.");
      return () => {
        active = false;
      };
    }

    const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
      if (!response?.credential) {
        setError("Google sign-in failed. Missing credential.");
        return;
      }

      setSubmitting(true);
      setError("");
      try {
        const payload = await signInWithGoogle({ credential: response.credential });
        localStorage.setItem("user_token", payload.token);
        router.push("/");
      } catch (err) {
        if (err instanceof TypeError && /fetch/i.test(err.message)) {
          setError("Could not reach the server. Check NEXT_PUBLIC_API_BASE_URL and backend server status.");
        } else {
          setError(err instanceof Error ? err.message : "Google sign-in failed.");
        }
      } finally {
        if (active) {
          setSubmitting(false);
        }
      }
    };

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonContainerRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const width = Math.max(240, Math.min(420, Math.floor(buttonContainerRef.current.clientWidth || 320)));
        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width,
        });
        setBooting(false);
      })
      .catch((scriptError) => {
        if (!active) return;
        setBooting(false);
        setError(scriptError instanceof Error ? scriptError.message : "Could not initialize Google sign-in.");
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-[rgba(73,153,173,0.22)] bg-[linear-gradient(140deg,rgba(73,153,173,0.09),rgba(73,153,173,0.03))] p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(47,118,135)]">
          Quick Sign-In
        </p>
        <div ref={buttonContainerRef} className="min-h-[44px]" />
        {booting ? <p className="mt-2 text-xs text-zinc-500">Loading Google sign-in...</p> : null}
        {submitting ? <p className="mt-2 text-xs text-zinc-500">Signing you in...</p> : null}
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
