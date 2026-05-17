/**
 * BookingModal — Branded GHL Calendar Embed
 *
 * Shown after quiz/form submission. Embeds the Solar Freedom GHL calendar
 * (ID: 3v6GXFtDrHMzs1j2DBkI) in a full-screen branded modal that matches
 * the site's dark industrial design system.
 */

import { useEffect, useRef } from "react";
import { X, CheckCircle, Clock, Shield, Phone, Star } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lead's first name to personalize the heading */
  firstName?: string;
}

const CALENDAR_ID = "3v6GXFtDrHMzs1j2DBkI";
const GHL_EMBED_URL = `https://api.leadconnectorhq.com/widget/booking/${CALENDAR_ID}`;

export default function BookingModal({ isOpen, onClose, firstName }: BookingModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const name = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl flex flex-col lg:flex-row"
        style={{
          background: "oklch(0.10 0.012 265)",
          border: "1px solid oklch(0.72 0.19 50 / 0.35)",
          boxShadow: "0 0 60px oklch(0.72 0.19 50 / 0.12), 0 25px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "oklch(0.18 0.01 265)", border: "1px solid oklch(0.3 0.01 265)" }}
          aria-label="Close booking modal"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>

        {/* ── LEFT PANEL — Info & Instructions ── */}
        <div
          className="lg:w-[380px] shrink-0 p-7 lg:p-8 flex flex-col gap-5 overflow-y-auto"
          style={{ borderRight: "1px solid oklch(0.2 0.01 265)" }}
        >
          {/* Success badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.72 0.19 50 / 0.2)", border: "1px solid oklch(0.72 0.19 50 / 0.5)" }}
            >
              <CheckCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-amber-400 text-xs font-mono uppercase tracking-widest">Case Submitted</span>
          </div>

          {/* Heading */}
          <div>
            <h2
              className="text-white leading-none mb-2"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 2.6rem)" }}
            >
              {name ? `${name}, one more step.` : "One more step."}
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Pick a time below for your <span className="text-amber-400 font-semibold">free 30-minute case review</span>. We'll analyze your contract live on the call — no obligation, no pressure.
            </p>
          </div>

          {/* What happens on the call */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.25 0.01 265)" }}
          >
            <div className="text-amber-500 text-xs font-mono uppercase tracking-widest">What Happens on the Call</div>

            {[
              {
                icon: <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                title: "Contract Analysis",
                desc: "Our advocate reviews your specific contract type (lease, loan, or PPA) to identify legal vulnerabilities.",
              },
              {
                icon: <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                title: "Case Strength Assessment",
                desc: "We tell you honestly whether you have a strong case, what your options are, and what the process looks like.",
              },
              {
                icon: <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                title: "Timeline & Next Steps",
                desc: "If you qualify, we walk you through exactly what happens next — no surprises, no hidden fees.",
              },
              {
                icon: <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
                title: "100% Free — No Obligation",
                desc: "This is a discovery call. There is zero pressure to move forward. We only take cases we believe we can win.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                {item.icon}
                <div>
                  <div className="text-white text-sm font-semibold mb-0.5">{item.title}</div>
                  <div className="text-zinc-400 text-xs leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex -space-x-2">
              {["JM", "SR", "KL", "TP"].map((initials) => (
                <div
                  key={initials}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2"
                  style={{
                    background: "oklch(0.45 0.15 50)",
                    borderColor: "oklch(0.10 0.012 265)",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="text-white text-xs font-semibold">3,000+ homeowners helped</div>
              <div className="text-zinc-500 text-[10px]">Average case resolved in 60–90 days</div>
            </div>
          </div>

          {/* Skip link */}
          <button
            onClick={onClose}
            className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors text-left"
          >
            I'll schedule later →
          </button>
        </div>

        {/* ── RIGHT PANEL — GHL Calendar Embed ── */}
        <div className="flex-1 min-h-[520px] lg:min-h-0 relative overflow-hidden">
          {/* Subtle amber glow at top */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.19 50 / 0.6), transparent)" }}
          />

          <iframe
            src={GHL_EMBED_URL}
            title="Book Your Free Case Review"
            className="w-full h-full min-h-[520px]"
            style={{
              border: "none",
              background: "transparent",
              colorScheme: "dark",
            }}
            loading="lazy"
            allow="camera; microphone; fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
