// Solar Freedom — Exit Intent Popup
// Fires when user moves mouse toward browser top (about to leave)
// Shows a compelling offer to capture abandoning visitors

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { recordLeadSubmission } from "@/lib/analytics";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [wantsGuide, setWantsGuide] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 10 && !dismissed && !show) {
      // Only fire once per session
      const fired = sessionStorage.getItem("exit_intent_fired");
      if (!fired) {
        setShow(true);
        sessionStorage.setItem("exit_intent_fired", "1");
      }
    }
  }, [dismissed, show]);

  useEffect(() => {
    // Wait 5 seconds before enabling exit intent
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  const captureExitIntent = trpc.exitIntent.capture.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmissionError("");
    try {
      // Persist to DB via tRPC
      const result = await captureExitIntent.mutateAsync({
        email,
        sourcePage: window.location.pathname,
        wantsGuide,
      });
      if (!recordLeadSubmission(result, "exit_intent_popup", window.location.pathname)) {
        setSubmissionError("We couldn't save your request. Please try again.");
        return;
      }
    } catch {
      recordLeadSubmission(null, "exit_intent_popup", window.location.pathname);
      setSubmissionError("We couldn't save your request. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto"
              style={{ background: "oklch(0.13 0.012 265)", border: "1px solid oklch(0.72 0.19 50 / 0.4)" }}
            >
              {/* Top amber bar */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }} />

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {!submitted ? (
                  <>
                    {/* Warning badge */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Wait — Before You Go</span>
                      </div>
                    </div>

                    <h2
                      className="text-white font-black leading-tight mb-3"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}
                    >
                      STILL TRAPPED IN YOUR
                      <br />
                      <span style={{ color: "oklch(0.72 0.19 50)" }}>SOLAR CONTRACT?</span>
                    </h2>

                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      Find out in 60 seconds if you qualify to cancel — even if your company went bankrupt, your system doesn't work, or you're paying more than your old electric bill.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email for a free case review"
                        required
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                        style={{ background: "oklch(0.18 0.012 265)", border: "1px solid oklch(0.3 0.01 265)" }}
                      />
                      <button
                        type="submit"
                        disabled={captureExitIntent.isPending}
                        className="w-full py-3.5 rounded-lg font-black text-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
                      >
                        GET MY FREE CASE REVIEW + GUIDE →
                      </button>
                      {submissionError && (
                        <p role="alert" className="text-red-400 text-sm text-center">{submissionError}</p>
                      )}
                      <label className="flex items-start gap-2 text-zinc-500 text-xs">
                        <input
                          type="checkbox"
                          checked={wantsGuide}
                          onChange={(e) => setWantsGuide(e.target.checked)}
                          className="mt-0.5 accent-amber-500"
                        />
                        <span>
                          Email me the free PDF: <span className="text-zinc-400">The Solar Contract Escape Guide (7 legal loopholes)</span>.
                        </span>
                      </label>
                    </form>

                    <p className="text-zinc-600 text-xs text-center mt-3">
                      No obligation. No cost. 100% confidential.
                    </p>

                    <button
                      onClick={handleDismiss}
                      className="block w-full text-center text-zinc-600 text-xs mt-3 hover:text-zinc-400 transition-colors"
                    >
                      No thanks, I'll stay trapped in my contract
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div
                      className="text-5xl font-black mb-3"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", color: "oklch(0.72 0.19 50)" }}
                    >
                      YOU'RE IN.
                    </div>
                    <p className="text-white font-semibold mb-2">Check your inbox within 24 hours.</p>
                    <p className="text-zinc-400 text-sm">Our attorneys will review your situation and reach out with your options. You’ll also receive immediate SMS confirmation and, if selected, your Solar Contract Escape Guide email sequence.</p>
                    <button
                      onClick={handleDismiss}
                      className="mt-6 text-amber-500 text-sm font-bold hover:text-amber-400 transition-colors"
                    >
                      Close ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
