import { Phone } from "lucide-react";
import { trackPhoneClick } from "@/lib/analytics";

export default function DesktopCallButton() {
  return (
    <a
      href="tel:9049214971"
      onClick={() => trackPhoneClick("desktop_floating_call_button")}
      className="hidden md:flex fixed left-4 bottom-6 z-[9989] items-center gap-2 rounded-full px-4 py-3 font-black text-black shadow-xl"
      style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.65 0.21 40))" }}
    >
      <Phone className="w-4 h-4" />
      <span className="text-xs uppercase tracking-wider">Call Now</span>
    </a>
  );
}
