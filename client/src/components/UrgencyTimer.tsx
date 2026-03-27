// Solar Freedom — Urgency Timer + Spots Counter
// Shows a countdown and "X spots remaining today" near the form submit button
// Resets daily, persists within session

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getInitialSpots(): number {
  const key = `sf_spots_${getTodayKey()}`;
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  // Random between 3–7 spots
  const spots = Math.floor(Math.random() * 5) + 3;
  sessionStorage.setItem(key, String(spots));
  return spots;
}

function getEndOfDay(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.getTime() - now.getTime();
}

export default function UrgencyTimer() {
  const [spots] = useState(getInitialSpots);
  const [timeLeft, setTimeLeft] = useState(getEndOfDay());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3_600_000);
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((timeLeft % 60_000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-4"
      style={{
        background: "oklch(0.15 0.04 25 / 0.3)",
        border: "1px solid oklch(0.55 0.18 25 / 0.4)",
      }}
    >
      {/* Spots remaining */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: i < spots
                  ? "oklch(0.72 0.19 50)"
                  : "oklch(0.25 0.01 265)",
              }}
            />
          ))}
        </div>
        <span className="text-xs font-bold" style={{ color: "oklch(0.72 0.19 50)" }}>
          {spots} review slot{spots !== 1 ? "s" : ""} left today
        </span>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-zinc-400 text-xs font-mono">
          Resets in {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    </div>
  );
}
