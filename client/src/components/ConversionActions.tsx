import { useId, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Loader2, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission, trackCTAClick, trackEvent, trackPhoneClick } from "@/lib/analytics";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { VEGAS_BOOKING_URL, vegasCampaignParams } from "@shared/vegasCampaign";

/**
 * Shared appointment-booking and lead-capture actions.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before this component, a blog article's "CTA" was a link to /#form — it took
 * the reader off the article they were reading and dropped them on the homepage
 * form. No article could book a call at all, and the article's only lead form
 * was `hidden lg:block`, so a visitor on a phone (the majority of this traffic)
 * had no way to convert without leaving the page.
 *
 * Non-Las-Vegas priority city pages had the same hole: anchor links down to a
 * form, but no calendar. City pages that use the generic template had a form
 * but never a booking action.
 *
 * This module is the single place that renders both actions, so every article
 * and every city page can offer "book a call" and "leave your number" without
 * duplicating the calendar URL, the mutation wiring, or the attribution logic.
 *
 * DELIBERATE CONSTRAINTS
 * ----------------------
 * 1. No new fixed/sticky elements. The site already has StickyMobileBar
 *    (z-9990), DesktopCallButton, CallbackWidget and the Las Vegas sticky
 *    action bar (z-10000). Adding another floating control would overlap them,
 *    so every action here is in normal document flow.
 * 2. The calendar iframe is only mounted once the dialog opens. That keeps
 *    GoHighLevel off the initial page load and avoids a third-party request
 *    before the visitor has shown intent.
 * 3. Copy makes no promise of a result, a timeline, or a specific outcome.
 *    Options genuinely depend on the agreement, the facts and the jurisdiction.
 */

const GHL_CALENDAR_URL = VEGAS_BOOKING_URL;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type BookingPlacement = "hero" | "mid" | "end" | "city_hero" | "city_mid" | "city_form" | "sidebar";

/** Campaign parameters are carried from the landing URL so a booking stays attributable. */
function useCampaignQuery(): string {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(vegasCampaignParams(window.location.search)).toString();
  }, []);
}

/**
 * A button that opens the real GoHighLevel calendar in a dialog.
 *
 * The booking is only complete after the provider confirms it — the copy says
 * so, because a dialog that opens is not an appointment and reporting must not
 * conflate the two.
 */
export function BookingButton({
  path,
  placement,
  label = "Book a 15-minute call",
  context,
  variant = "solid",
}: {
  path: string;
  placement: BookingPlacement;
  label?: string;
  context?: string;
  variant?: "solid" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const campaignQuery = useCampaignQuery();
  const bookingUrl = campaignQuery ? `${GHL_CALENDAR_URL}?${campaignQuery}` : GHL_CALENDAR_URL;

  const handleOpen = () => {
    trackEvent("booking_calendar_open", {
      page_path: path,
      cta_placement: placement,
      ...(campaignQuery ? Object.fromEntries(new URLSearchParams(campaignQuery)) : {}),
    });
    setOpen(true);
  };

  const solidClass =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition-all hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 active:scale-[0.99]";
  const outlineClass =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-amber-500/60 bg-transparent px-6 py-3 text-sm font-bold text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-500/10 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 active:scale-[0.99]";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        data-booking-placement={placement}
        className={variant === "solid" ? solidClass : outlineClass}
      >
        <CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[10010] max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-[#13161D] text-white">
          <DialogHeader>
            <DialogTitle>
              {context ? `Choose a time to talk about ${context}` : "Choose a time for your case-review call"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Follow the calendar&apos;s steps to provide your details and pick an available time. Your booking is
              complete only once the provider confirms it.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <iframe
              src={bookingUrl}
              title="Case-review booking calendar"
              loading="lazy"
              className="h-[580px] w-full rounded-lg border-0 bg-white"
            />
          )}
          <p className="text-xs leading-6 text-zinc-500">
            Having trouble?{" "}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline underline-offset-4"
            >
              Open the calendar in a new tab
            </a>
            . Options depend on your agreement, facts and jurisdiction. No result is guaranteed.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Phone-first lead capture that persists to the database before it claims success.
 *
 * `recordLeadSubmission` returns false when the server did not persist the lead,
 * and in that case the visitor is told so instead of being shown a fake
 * confirmation. A thank-you screen for a lead that never reached the CRM is
 * worse than an error message, because it silently loses the lead.
 */
export function LeadCaptureForm({
  formName,
  path,
  placement,
  intent,
  heading = "Prefer we call you?",
  subheading = "Leave your number and we will reach out. No obligation.",
  buttonLabel = "Request my callback",
  compact = false,
}: {
  formName: string;
  path: string;
  placement: BookingPlacement;
  intent?: string;
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  compact?: boolean;
}) {
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const callbackMutation = trpc.leads.quickCallback.useMutation();
  const { phoneDisplay, phoneHref, phoneDigits } = useSiteConfig();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!phone.trim()) return;
    setError("");

    const trimmedEmail = email.trim();
    const emailIsUsable = trimmedEmail.length > 0 && EMAIL_PATTERN.test(trimmedEmail);
    if (trimmedEmail.length > 0 && !emailIsUsable) {
      setError("That email address does not look right. You can leave it blank.");
      return;
    }

    try {
      const result = await callbackMutation.mutateAsync({
        name: name.trim() || undefined,
        phone: phone.trim(),
        email: emailIsUsable ? trimmedEmail : undefined,
        intent,
        formName,
        sourcePage: path,
        sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      if (!recordLeadSubmission(result, formName, path)) {
        setError("We could not save your request. Please call us instead.");
        return;
      }
      trackCTAClick(`${formName}_lead_captured`, path);
      setSubmitted(true);
    } catch {
      recordLeadSubmission(null, formName, path);
      setError("We could not save your request. Please call us instead.");
    }
  };

  if (submitted) {
    return (
      <div
        data-lead-form={formName}
        data-lead-form-state="submitted"
        className="rounded-xl border border-green-500/30 bg-green-500/10 p-5"
      >
        <div className="mb-2 flex items-center gap-2 font-bold text-green-400">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Request received
        </div>
        <p className="mb-4 text-sm leading-6 text-zinc-300">
          We have your number and will reach out. Want to lock in a time instead of waiting for a call?
        </p>
        <BookingButton path={path} placement={placement} label="Pick a time now" />
      </div>
    );
  }

  return (
    <div
      data-lead-form={formName}
      data-lead-form-state="idle"
      className={`rounded-xl border border-amber-500/30 bg-zinc-900/80 ${compact ? "p-4" : "p-5"}`}
    >
      <h3
        className="mb-1 text-xl leading-tight text-white"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      >
        {heading}
      </h3>
      <p className="mb-4 text-xs leading-5 text-zinc-400">{subheading}</p>
      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        <div>
          <label htmlFor={`${uid}-name`} className="sr-only">
            Your name
          </label>
          <input
            id={`${uid}-name`}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name (optional)"
            autoComplete="name"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/40"
            style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="sr-only">
            Best phone number
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Best phone number"
            autoComplete="tel"
            inputMode="tel"
            required
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/40"
            style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${uid}-email`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            autoComplete="email"
            inputMode="email"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/40"
            style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
          />
        </div>
        <button
          type="submit"
          disabled={callbackMutation.isPending || !phone.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
        >
          {callbackMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending...
            </>
          ) : (
            buttonLabel
          )}
        </button>
        {!phone.trim() && (
          <p className="text-xs leading-5 text-zinc-400">Enter your phone number to enable the callback request.</p>
        )}
        {error && (
          <p role="alert" className="text-xs leading-5 text-red-400">
            {error}
          </p>
        )}
      </form>
      <a
        href={phoneHref}
        onClick={() => trackPhoneClick(`${formName}_form_call`, phoneDigits)}
        className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
      >
        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
        Or call {phoneDisplay} now
      </a>
    </div>
  );
}

/**
 * The combined block placed at natural decision points in an article or city page.
 *
 * `hero` and `city_hero` render the booking action only. A form above the fold
 * on mobile pushes the article itself off screen, and a reader who has not yet
 * read anything has no reason to hand over a phone number.
 */
export default function ConversionActions({
  path,
  placement,
  formName,
  context,
  heading,
  subheading,
  showForm = true,
  bookingLabel = "Book a 15-minute call",
}: {
  path: string;
  placement: BookingPlacement;
  formName: string;
  context?: string;
  heading?: string;
  subheading?: string;
  showForm?: boolean;
  bookingLabel?: string;
}) {
  const resolvedHeading = heading ?? "Talk through your options — no obligation";
  const resolvedSubheading =
    subheading ??
    "A short call to walk through what you signed, what you were told, and what may be worth reviewing. Nothing is decided on the call.";

  return (
    <section
      data-conversion-block={placement}
      className="my-12 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-zinc-900 to-zinc-800/80 p-6 sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div>
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-amber-500">
            — Next step
          </div>
          <h2
            className="mb-3 text-2xl leading-tight text-white sm:text-3xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {resolvedHeading}
          </h2>
          <p className="mb-5 max-w-lg text-sm leading-7 text-zinc-300">{resolvedSubheading}</p>
          <BookingButton path={path} placement={placement} label={bookingLabel} context={context} />
          <p className="mt-3 font-mono text-xs leading-5 text-zinc-500">
            Options depend on your agreement, facts and jurisdiction. No result is guaranteed.
          </p>
        </div>
        {showForm && (
          <LeadCaptureForm
            formName={formName}
            path={path}
            placement={placement}
            compact
            heading="Prefer a callback?"
            subheading="Leave your number and we will reach out. No obligation."
          />
        )}
      </div>
    </section>
  );
}

/**
 * Compact single-line prompt used at the top of an article, above the fold.
 *
 * Deliberately not a full block: it must not push the headline or the first
 * paragraph off a 390px screen.
 */
export function HeroBookingPrompt({
  path,
  placement,
  formName,
  anchorHref = "#article-lead-form",
}: {
  path: string;
  placement: BookingPlacement;
  formName: string;
  anchorHref?: string;
}) {
  const handleAnchor = () => trackCTAClick(`${formName}_hero_to_form`, path);
  return (
    <div data-conversion-block={`${placement}-prompt`} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="sm:max-w-xs">
        <BookingButton path={path} placement={placement} label="Book a 15-minute call" />
      </div>
      <a
        href={anchorHref}
        onClick={handleAnchor}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-amber-500/60 hover:text-amber-300"
      >
        Or leave your number
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}