import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { trackCTAClick, trackFormSubmit } from "@/lib/analytics";

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
const CALENDAR_ID = "Glvb9OZtDFHDMiwvHpli";
const GHL_CALENDAR_BASE = `https://link.myinfinite.ai/widget/booking/${CALENDAR_ID}`;

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
  const callbackMutation = trpc.leads.quickCallback.useMutation();

  // Build the GHL calendar URL with pre-filled name/phone from the form.
  // Falls back to the prop scheduleUrl if explicitly provided, otherwise uses GHL.
  const calendarUrl = useMemo(() => {
    if (scheduleUrl) return scheduleUrl;
    const params = new URLSearchParams();
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    if (firstName) params.set("first_name", firstName);
    if (lastName) params.set("last_name", lastName);
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      const e164 =
        digits.length === 10
          ? `+1${digits}`
          : digits.length === 11 && digits.startsWith("1")
          ? `+${digits}`
          : phone;
      params.set("phone", e164);
    }
    const qs = params.toString();
    return qs ? `${GHL_CALENDAR_BASE}?${qs}` : GHL_CALENDAR_BASE;
  }, [scheduleUrl, name, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    await callbackMutation.mutateAsync({
      name: name.trim() || undefined,
      phone: phone.trim(),
      intent: intentTag,
      formName,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    trackFormSubmit(formName, typeof window !== "undefined" ? window.location.pathname : "unknown");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`rounded-xl border border-green-500/30 bg-green-500/10 p-4 ${className}`}>
        <div className="text-green-400 font-bold text-sm mb-2">✅ Callback requested!</div>
        <p className="text-zinc-300 text-xs mb-3">
          We'll call you shortly. Want to lock in a specific time?
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
        <button
          type="submit"
          disabled={callbackMutation.isPending || !phone.trim()}
          className="w-full py-2.5 rounded-lg font-black text-black text-xs uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
        >
          {callbackMutation.isPending ? "Submitting..." : buttonLabel}
        </button>
      </form>

      {showSchedule && (
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
        </a>
      )}
    </div>
  );
}
