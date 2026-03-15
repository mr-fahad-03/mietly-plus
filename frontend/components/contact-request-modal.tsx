"use client";

import { FormEvent, useMemo, useState } from "react";
import { submitSupportRequest } from "@/lib/api";
import { Locale } from "@/lib/types";

type ContactRequestModalProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  source?: string;
};

const copy = {
  en: {
    title: "Contact us",
    subtitle: "Tell us what you need and our support team will get back to you.",
    name: "Full name",
    email: "Email address",
    phone: "Phone number (optional)",
    subject: "Subject (optional)",
    message: "Message",
    messagePlaceholder: "Write your request...",
    cancel: "Cancel",
    submit: "Submit request",
    submitting: "Submitting...",
    success: "Your request has been submitted successfully.",
  },
  de: {
    title: "Kontaktieren Sie uns",
    subtitle: "Teilen Sie uns Ihr Anliegen mit. Unser Support-Team meldet sich bei Ihnen.",
    name: "Vollständiger Name",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer (optional)",
    subject: "Betreff (optional)",
    message: "Nachricht",
    messagePlaceholder: "Schreiben Sie Ihre Anfrage...",
    cancel: "Abbrechen",
    submit: "Anfrage senden",
    submitting: "Wird gesendet...",
    success: "Ihre Anfrage wurde erfolgreich gesendet.",
  },
};

export function ContactRequestModal({ open, onClose, locale, source = "footer" }: ContactRequestModalProps) {
  const text = useMemo(() => copy[locale], [locale]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      await submitSupportRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
        locale,
        source,
        pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      });
      setFeedback(text.success);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-zinc-900">{text.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{text.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-2 py-1 text-sm">
            x
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={text.name}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={text.email}
            type="email"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={text.phone}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={text.subject}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={text.messagePlaceholder}
            required
            rows={5}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />

          {feedback ? <p className="text-sm text-lime-700">{feedback}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              {text.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? text.submitting : text.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

