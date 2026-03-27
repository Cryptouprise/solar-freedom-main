// Solar Freedom — Sticky Mobile Bottom Bar
// Persistent CTA bar visible on mobile only
// Appears after user scrolls 300px down the page

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "lucide-react";

export default function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9990] md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: "linear-gradient(135deg, oklch(0.13 0.012 265) 0%, oklch(0.15 0.015 265) 100%)",
              borderTop: "1px solid oklch(0.72 0.19 50 / 0.4)",
            }}
          >
            {/* Call button */}
            <a
              href="tel:9049214971"
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg font-black text-black text-sm uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
            >
              <Phone className="w-4 h-4" />
              Call Grace Now
            </a>
            {/* Text button */}
            <a
              href="sms:9049214971"
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{
                background: "oklch(0.18 0.012 265)",
                border: "1px solid oklch(0.72 0.19 50 / 0.5)",
                color: "oklch(0.72 0.19 50)",
              }}
            >
              💬 Text Us
            </a>
          </div>
          <div
            className="text-center text-zinc-500 text-[10px] py-1"
            style={{ background: "oklch(0.10 0.01 265)" }}
          >
            Grace Silver · AI Executive Assistant · (904) 921-4971
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
