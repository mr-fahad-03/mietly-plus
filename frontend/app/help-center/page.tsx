"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { submitSupportRequest } from "@/lib/api";
import { useSiteLocale } from "@/lib/use-site-locale";

const SUPPORT_EMAIL = "support@mietlyplus.de";

const copy = {
  en: {
    heroTag: "HELP CENTER",
    title: "Help Center",
    subtitle:
      "Need support before, during, or after your order? Our Help Center covers rental plans, payments, delivery, returns, verification, product condition, and account support.",
    cardTitle: "Ways to Reach Us",
    cardEmail: "Support Email",
    cardReply: "Average reply time",
    cardReplyValue: "Within 24 hours",
    cardHours: "Availability",
    cardHoursValue: "Monday to Saturday, 09:00-18:00 (CET)",
    cardFaqTitle: "Need quick answers first?",
    cardFaqBody: "See our",
    cardFaqLink: "How It Works",
    formTitle: "Get in touch",
    formSubtitle: "Fill out the form and we will reach out by email.",
    name: "Full name",
    email: "Email address",
    phone: "Phone number (optional)",
    subject: "Subject",
    message: "Message",
    messagePlaceholder: "Tell us your question in detail...",
    submit: "Send message",
    submitting: "Sending...",
    success: "Thanks. Your request has been sent successfully.",
    errorDefault: "Could not submit your request. Please try again.",
  },
  de: {
    heroTag: "HILFE-CENTER",
    title: "Hilfecenter",
    subtitle:
      "Du brauchst Unterstützung vor, während oder nach deiner Bestellung? In unserem Hilfecenter findest du Antworten auf häufige Fragen zu Mietplänen, Zahlungen, Lieferung, Rückgabe, Verifizierung, Produktzustand und Kontothemen. Falls deine Frage dort nicht beantwortet wird, kannst du uns jederzeit per E-Mail kontaktieren.",
    cardTitle: "Kontaktmoeglichkeiten",
    cardEmail: "Support-E-Mail",
    cardReply: "Durchschnittliche Antwortzeit",
    cardReplyValue: "Innerhalb von 24 Stunden",
    cardHours: "Verfuegbarkeit",
    cardHoursValue: "Montag bis Samstag, 09:00-18:00 Uhr (MEZ)",
    cardFaqTitle: "Schnelle Antworten zuerst?",
    cardFaqBody: "Sieh dir an:",
    cardFaqLink: "So funktioniert es",
    formTitle: "Kontakt aufnehmen",
    formSubtitle: "Wenn du nicht findest, was du suchst, sende uns eine Nachricht per Formular.",
    name: "Vollstaendiger Name",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer (optional)",
    subject: "Betreff",
    message: "Nachricht",
    messagePlaceholder: "Beschreiben Sie Ihr Anliegen moeglichst genau...",
    submit: "Nachricht senden",
    submitting: "Wird gesendet...",
    success: "Danke. Ihre Anfrage wurde erfolgreich gesendet.",
    errorDefault: "Ihre Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.",
  },
};

export default function HelpCenterPage() {
  const { locale } = useSiteLocale("de");
  const text = useMemo(() => copy[locale], [locale]);
  const [source, setSource] = useState("help_center_page");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = String(params.get("source") || "")
      .trim()
      .toLowerCase();
    if (raw === "get-in-touch") {
      setSource("footer_get_in_touch");
      return;
    }
    if (raw === "help-center") {
      setSource("footer_help_center");
      return;
    }
    setSource("help_center_page");
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setFeedback("");
    setError("");

    try {
      await submitSupportRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
        locale,
        source,
        pageUrl: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/help-center",
      });
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setFeedback(text.success);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f3f8_0%,#f8fcfe_38%,#ffffff_68%)]">
      <ClientNavbar />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-10 md:pt-14">
        <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_70px_rgba(16,24,40,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative overflow-hidden bg-[linear-gradient(160deg,#3f8aa1_0%,#4c9db6_45%,#70b8cb_100%)] p-7 text-white md:p-10">
              <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/15 blur-xl" />
              <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-white/15 blur-xl" />
              <p className="relative inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.14em]">
                {text.heroTag}
              </p>
              <h1 className="relative mt-4 text-3xl font-black leading-tight md:text-4xl">{text.title}</h1>
              <p className="relative mt-4 max-w-[520px] text-[15px] leading-7 text-white/90">{text.subtitle}</p>

              <div className="relative mt-7 space-y-3 rounded-2xl border border-white/30 bg-white/10 p-5">
                <h2 className="text-lg font-bold">{text.cardTitle}</h2>
                <div className="grid gap-2 text-sm text-white/95">
                  <p>
                    <span className="font-semibold">{text.cardEmail}:</span> {SUPPORT_EMAIL}
                  </p>
                  <p>
                    <span className="font-semibold">{text.cardReply}:</span> {text.cardReplyValue}
                  </p>
                  <p>
                    <span className="font-semibold">{text.cardHours}:</span> {text.cardHoursValue}
                  </p>
                </div>
              </div>

              <div className="relative mt-4 rounded-2xl border border-white/30 bg-white/10 p-5 text-sm leading-7 text-white/95">
                <p className="font-semibold">{text.cardFaqTitle}</p>
                <p className="mt-1">
                  {text.cardFaqBody}{" "}
                  <Link href="/info/how-it-works" className="font-bold underline underline-offset-4">
                    {text.cardFaqLink}
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div id="get-in-touch" className="p-6 md:p-10">
              <h2 className="text-2xl font-black text-zinc-900 md:text-3xl">{text.formTitle}</h2>
              <p className="mt-2 text-sm text-zinc-600">{text.formSubtitle}</p>

              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-zinc-800">
                  {text.name}
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="h-12 rounded-xl border border-zinc-300 px-4 text-sm outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.18)]"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-zinc-800">
                    {text.email}
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      required
                      className="h-12 rounded-xl border border-zinc-300 px-4 text-sm outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.18)]"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-zinc-800">
                    {text.phone}
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-12 rounded-xl border border-zinc-300 px-4 text-sm outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.18)]"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-zinc-800">
                  {text.subject}
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="h-12 rounded-xl border border-zinc-300 px-4 text-sm outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.18)]"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-zinc-800">
                  {text.message}
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    rows={6}
                    placeholder={text.messagePlaceholder}
                    className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.18)]"
                  />
                </label>

                {feedback ? <p className="rounded-lg bg-lime-50 px-3 py-2 text-sm text-lime-700">{feedback}</p> : null}
                {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-12 items-center justify-center rounded-xl bg-[rgb(73,153,173)] px-6 text-sm font-extrabold text-white transition hover:bg-[rgb(60,138,158)] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {loading ? text.submitting : text.submit}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
