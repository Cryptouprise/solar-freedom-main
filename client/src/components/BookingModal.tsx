import { CheckCircle2, Clock3, FileText, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstName?: string;
}

const CALENDAR_URL = "https://link.myinfinite.ai/widget/booking/Glvb9OZtDFHDMiwvHpli";

export default function BookingModal({ isOpen, onClose, firstName }: BookingModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedName = firstName?.trim()
    ? `${firstName.trim().charAt(0).toUpperCase()}${firstName.trim().slice(1).toLowerCase()}`
    : null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-dialog-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950 shadow-2xl lg:flex-row">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900 text-slate-300 transition hover:border-amber-300 hover:text-white"
          aria-label="Close scheduler"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <section className="shrink-0 space-y-6 overflow-y-auto border-b border-white/10 p-7 lg:w-[390px] lg:border-b-0 lg:border-r lg:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Optional scheduler
          </div>

          <div>
            <h2 id="booking-dialog-title" className="font-display text-4xl leading-none text-white">
              {normalizedName ? `${normalizedName}, choose a time if useful.` : "Choose a time if useful."}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Review the available meeting details before booking. Scheduling does not guarantee a response,
              service, professional relationship, fee, timeline, or outcome.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-5">
            {[
              {
                icon: FileText,
                title: "Bring the records",
                detail: "Have the signed agreement, financing documents, sales messages, bills, and your questions available.",
              },
              {
                icon: ShieldCheck,
                title: "No automatic relationship",
                detail: "An intake meeting does not create an attorney-client relationship or guarantee representation.",
              },
              {
                icon: Clock3,
                title: "Terms come first",
                detail: "Any role, scope, fee, and timing must be confirmed separately in writing before paid work begins.",
              },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            The embedded calendar is operated by a third-party scheduling provider. Information entered there is
            sent directly to that provider. Do not include passwords, account credentials, or unnecessary sensitive
            documents.
          </p>

          <button type="button" onClick={onClose} className="text-left text-xs text-slate-500 hover:text-slate-300">
            Return without scheduling →
          </button>
        </section>

        <div className="relative min-h-[540px] flex-1 overflow-hidden bg-slate-900">
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          <iframe
            src={CALENDAR_URL}
            title="Third-party appointment scheduler"
            className="h-full min-h-[540px] w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
