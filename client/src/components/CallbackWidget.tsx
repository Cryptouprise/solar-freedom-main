import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, X } from "lucide-react";
import QuickCallbackForm from "@/components/QuickCallbackForm";
import { trackCTAClick } from "@/lib/analytics";

export default function CallbackWidget() {
  const [open, setOpen] = useState(false);

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
            <QuickCallbackForm
              formName="floating_callback_widget"
              title="Get a call back in 60 seconds"
              subtitle="Drop your number and Grace will call or text you right away."
              buttonLabel="Request My Callback"
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
