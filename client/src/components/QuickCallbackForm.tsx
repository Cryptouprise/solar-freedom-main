import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission, trackCTAClick } from "@/lib/analytics";
import { ContactConsentFields } from "@/components/ContactConsentFields";
import { buildSchedulerUrl } from "@/lib/scheduler";
import { CONTACT_CONSENT_VERSION } from "@shared/leadConsent";

interface QuickCallbackFormProps {
  formName: string;
  title: string;
  subtitle?: string;
  intentTag?: string;
  buttonLabel?: string;
  showName?: boolean;
  showSchedule?: boolean;
  scheduleUrl?: string;
  className?: string;
}

// Same GHL calendar used by BookingModal — calendar ID: Glvb9OZtDFHDMiwvHpli
export default function QuickCallbackForm({
  formName,
  title,
  subtitle,
  intentTag,
  buttonLabel = "Get My Call Back",
  showName = true,
  showSchedule = false,
  scheduleUrl,
  className = "",
}: QuickCallbackFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const callbackMutation = trpc.leads.quickCallback.useMutation();

  // Never place contact data in a third-party GET URL. The scheduler receives
  // only allowlisted, non-contact campaign context.
  const calendarUrl = useMemo(
    () => buildSchedulerUrl(scheduleUrl, {
      source: "quick_callback",
      campaign: formName,
    }),
    [scheduleUrl, formName],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (!contactConsent) {
      setSubmissionError("Please authorize contact about this request before submitting.");
      return;
    }
    setSubmissionError("");
    const page = typeof window !== "undefined" ? window.location.pathname : "unknown";
    try {
      const result = await callbackMutation.mutateAsync({
        name: name.trim() || undefined,
        phone: phone.trim(),
        intent: intentTag,
        formName,
        contactConsent,
        smsConsent,
        consentVersion: CONTACT_CONSENT_VERSION,
        website,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      if (!recordLeadSubmission(result, formName, page)) {
        setSubmissionError("We couldn't save your callback request. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      recordLeadSubmission(null, formName, page);
      setSubmissionError("We couldn't save your callback request. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-xl border border-green-500/30 bg-green-500/10 p-4 ${className}`}>
        <div className="text-green-400 font-bold text-sm mb-2">✅ Callback requested!</div>
        <p className="text-zinc-300 text-xs mb-3">
          Your request was received. Want to choose a time that works for you?
        </p>
        {/* Always show the GHL calendar after submit — no showSchedule gate needed */}
        <div className="rounded-lg overflow-hidden border border-amber-500/20">
          <iframe
            src={calendarUrl}
            width="100%"
            height="500"
            frameBorder="0"
            title="Book a free consultation"
            className="block"
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          Scheduling is provided by a third-party booking service. Your submitted
          name and phone number are not included in this booking URL. See our{" "}
          <a className="text-amber-400 underline" href="/privacy-policy">Privacy Policy</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-amber-500/30 bg-zinc-900/80 p-4 ${className}`}>
      <div className="text-amber-400 text-[10px] font-mono uppercase tracking-widest mb-2">Quick Callback</div>
      <h3
        className="text-white font-black text-lg leading-tight mb-2"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      >
        {title}
      </h3>
      {subtitle && <p className="text-zinc-400 text-xs mb-3">{subtitle}</p>}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {showName && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/40"
            style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
          />
        )}
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Best phone number"
          required
          className="w-full px-3 py-2.5 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/40"
          style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
        />
        <ContactConsentFields
          idPrefix={`${formName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-quick-callback`}
          contactConsent={contactConsent}
          smsConsent={smsConsent}
          website={website}
          onContactConsentChange={setContactConsent}
          onSmsConsentChange={setSmsConsent}
          onWebsiteChange={setWebsite}
          className="pt-1"
        />
        <button
          type="submit"
          disabled={callbackMutation.isPending || !phone.trim() || !contactConsent}
          className="w-full py-2.5 rounded-lg font-black text-black text-xs uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
        >
          {callbackMutation.isPending ? "Submitting..." : buttonLabel}
        </button>
        {submissionError && (
          <p role="alert" className="text-red-400 text-xs text-center">{submissionError}</p>
        )}
      </form>

      {showSchedule && (
        <>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackCTAClick(
              `${formName}_schedule_consult`,
              typeof window !== "undefined" ? window.location.pathname : "unknown"
            )
          }
          className="block text-center mt-2.5 text-amber-400 hover:text-amber-300 text-xs font-semibold"
        >
          Prefer to pick a time? Schedule a free 15-min consultation →
          <span className="sr-only"> (opens a third-party booking service)</span>
        </a>
        <p className="mt-1 text-center text-[10px] leading-relaxed text-zinc-500">
          Contact details typed above are not added to the scheduling link. See our{" "}
          <a className="underline hover:text-zinc-300" href="/privacy-policy">Privacy Policy</a>.
        </p>
        </>
      )}
    </div>
  );
}
