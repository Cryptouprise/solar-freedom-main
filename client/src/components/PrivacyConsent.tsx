import React, { useEffect, useRef, useState } from "react";
import {
  PRIVACY_PREFERENCE_EVENT,
  PRIVACY_RESET_EVENT,
  PRIVACY_STORAGE_KEY,
  readPrivacyPreference,
  resetPrivacyPreference,
  savePrivacyPreference,
  type AnalyticsPreference,
  type PrivacyPreference,
} from "@/lib/privacy";

export default function PrivacyConsent() {
  const [preference, setPreference] = useState<PrivacyPreference | null>(() =>
    readPrivacyPreference()
  );
  const [announcement, setAnnouncement] = useState("");
  const focusBannerAfterReset = useRef(false);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const refreshPreference = () => setPreference(readPrivacyPreference());
    const handleReset = () => {
      focusBannerAfterReset.current = true;
      setPreference(null);
      setAnnouncement("Privacy choices reset. Optional analytics remains off.");
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRIVACY_STORAGE_KEY || event.key === null) {
        refreshPreference();
      }
    };

    window.addEventListener(PRIVACY_PREFERENCE_EVENT, refreshPreference);
    window.addEventListener(PRIVACY_RESET_EVENT, handleReset);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PRIVACY_PREFERENCE_EVENT, refreshPreference);
      window.removeEventListener(PRIVACY_RESET_EVENT, handleReset);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!preference && focusBannerAfterReset.current) {
      focusBannerAfterReset.current = false;
      acceptButtonRef.current?.focus();
    }
  }, [preference]);

  const choose = (analytics: AnalyticsPreference) => {
    const saved = savePrivacyPreference(analytics);
    setPreference(saved);
    if (!saved) {
      setAnnouncement(
        "Your browser could not save this choice. Optional analytics remains off."
      );
      return;
    }
    setAnnouncement(
      analytics === "granted"
        ? "Optional analytics accepted."
        : "Optional analytics declined."
    );
  };

  if (preference) {
    return (
      <div className="fixed bottom-3 left-3 z-[70]">
        <button
          type="button"
          onClick={() => resetPrivacyPreference()}
          className="rounded-full border border-white/20 bg-slate-950/95 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg transition hover:border-amber-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Change privacy choices"
        >
          Privacy choices
        </button>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-label="Privacy choices"
      aria-describedby="privacy-consent-description"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-amber-400/30 bg-slate-950/98 p-4 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur md:flex md:items-center md:gap-5 md:p-5"
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-white">
          Your privacy, your choice
        </h2>
        <p
          id="privacy-consent-description"
          className="mt-1 text-sm leading-relaxed text-slate-300"
        >
          We use optional Google Analytics only to understand public-page
          visits. It stays off unless you accept. We do not enable advertising,
          identity-resolution, chat-tracking, or session-replay tools.
        </p>
        {announcement && (
          <p role="status" className="mt-2 text-xs font-medium text-amber-200">
            {announcement}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row md:mt-0 md:flex-none">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Decline optional analytics
        </button>
        <button
          ref={acceptButtonRef}
          type="button"
          onClick={() => choose("granted")}
          className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Accept analytics
        </button>
      </div>
    </section>
  );
}
