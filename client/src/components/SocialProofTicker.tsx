// Solar Freedom — Social Proof Ticker
// Rotating live-style notifications near the form to build trust and urgency
// Cycles through realistic recent activity every 4 seconds

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const NOTIFICATIONS = [
  { name: "Maria T.", city: "Tampa, FL", action: "just submitted her Sunnova case", time: "2 min ago" },
  { name: "James R.", city: "Phoenix, AZ", action: "SunPower contract canceled ✓", time: "8 min ago" },
  { name: "David K.", city: "San Diego, CA", action: "received free case review", time: "14 min ago" },
  { name: "Sandra M.", city: "Houston, TX", action: "Vivint Solar loan discharged ✓", time: "21 min ago" },
  { name: "Robert L.", city: "Las Vegas, NV", action: "just submitted his Lumio case", time: "29 min ago" },
  { name: "Patricia W.", city: "Orlando, FL", action: "Pink Energy contract canceled ✓", time: "35 min ago" },
  { name: "Michael B.", city: "Sacramento, CA", action: "received $14,200 in refunds ✓", time: "41 min ago" },
  { name: "Jennifer C.", city: "Dallas, TX", action: "just submitted her ADT Solar case", time: "48 min ago" },
  { name: "Thomas H.", city: "Austin, TX", action: "GoodLeap loan voided ✓", time: "55 min ago" },
  { name: "Linda G.", city: "Jacksonville, FL", action: "just submitted her SunPower case", time: "1 hr ago" },
  { name: "Kevin P.", city: "Denver, CO", action: "Mosaic loan canceled ✓", time: "1 hr ago" },
  { name: "Nancy F.", city: "Atlanta, GA", action: "just submitted her Titan Solar case", time: "2 hrs ago" },
];

export default function SocialProofTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = NOTIFICATIONS[index];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 overflow-hidden"
      style={{
        background: "oklch(0.12 0.012 265)",
        border: "1px solid oklch(0.3 0.01 265)",
      }}
    >
      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.19 50)" }} />
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            <span className="text-white text-xs font-semibold">{current.name}</span>
            <span className="text-zinc-400 text-xs"> from {current.city} </span>
            <span className="text-zinc-300 text-xs">{current.action}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="text-zinc-600 text-[10px] shrink-0 font-mono">{current.time}</span>
    </div>
  );
}
