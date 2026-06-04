import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, X } from "lucide-react";
import QuickCallbackForm from "@/components/QuickCallbackForm";
import { trackCTAClick } from "@/lib/analytics";

const QUALIFY_INTENTS = [
  {
    id: "cancel_contract",
    label: "Cancel contract",
    route: "/solar-contract-help",
    description: "Get your cancellation options fast.",
  },
  {
    id: "lien_issue",
    label: "Lien issue",
    route: "/solar-lien-removal",
    description: "Fix title and lien complications.",
  },
  {
    id: "selling_home",
    label: "Selling home",
    route: "/selling-house-with-solar",
    description: "Clear blockers before listing.",
  },
] as const;

export default function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [intentId, setIntentId] = useState<(typeof QUALIFY_INTENTS)[number]["id"]>("cancel_contract");
  const selectedIntent = QUALIFY_INTENTS.find((intent) => intent.id === intentId) ?? QUALIFY_INTENTS[0];

  return (
    <div className="fixed right-4 bottom-24 z-[9989] hidden md:block">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[320px]"
          >
            <div className="mb-2 rounded-xl border border-amber-500/20 bg-zinc-900/90 p-2.5">
              <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                What's your main situation?
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {QUALIFY_INTENTS.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => {
                      setIntentId(intent.id);
                      trackCTAClick(`floating_callback_intent_${intent.id}`, typeof window !== "undefined" ? window.location.pathname : "unknown");
                    }}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                      intent.id === selectedIntent.id
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="font-semibold">{intent.label}</div>
                    <div className="text-[11px] text-zinc-400">{intent.description}</div>
                  </button>
                ))}
              </div>
              <a
                href={`${selectedIntent.route}?utm_source=callback_widget&utm_medium=onsite&utm_campaign=${selectedIntent.id}`}
                onClick={() =>
                  trackCTAClick(`floating_callback_route_${selectedIntent.id}`, typeof window !== "undefined" ? window.location.pathname : "unknown")
                }
                className="mt-2 block text-center text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Read the full guide for this issue →
              </a>
            </div>
            <QuickCallbackForm
              formName={`floating_callback_widget_${selectedIntent.id}`}
              intentTag={selectedIntent.id}
              title="Get your free case review call in 60 seconds"
              subtitle={`Selected: ${selectedIntent.label}. Drop your number and Grace will call or text you right away.`}
              buttonLabel="Get My Free Case Review"
              showSchedule
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) trackCTAClick("floating_callback_widget_open", typeof window !== "undefined" ? window.location.pathname : "unknown");
        }}
        className="flex items-center gap-2 rounded-full px-4 py-3 font-black text-black shadow-xl"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
      >
        {open ? <X className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
        <span className="text-xs uppercase tracking-wider">{open ? "Close" : "Call Back"}</span>
      </motion.button>
    </div>
  );
}
