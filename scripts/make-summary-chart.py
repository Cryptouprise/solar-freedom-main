#!/usr/bin/env python3
"""Render the 26 Nov 2026 change summary chart.

Two panels, both driven by the same numbers already recorded in
shared/changeLog.ts and docs/CHANGE-LOG.md, so the chart cannot drift from the
written record:
  left  - the 53 changes of 26 Nov 2026 grouped by class
  right - the honest traffic position: what is actually happening in Search
          Console, and which part of it content work can and cannot move
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BG = "#0d0f14"
FG = "#f8fafc"
MUTED = "#94a3b8"
AMBER = "#f97316"
RED = "#ef4444"
GREEN = "#22c55e"
BLUE = "#38bdf8"
GREY = "#475569"

fig = plt.figure(figsize=(16, 9), facecolor=BG)
fig.suptitle(
    "Solar Freedom — what changed on 26 Nov 2026, and what it can move",
    color=FG, fontsize=19, fontweight="bold", x=0.5, y=0.955,
)

# ── Left panel: changes by class ────────────────────────────────────────────
ax1 = fig.add_axes([0.135, 0.30, 0.29, 0.52])
ax1.set_facecolor(BG)

classes = ["SEO", "accuracy", "defect", "content", "infrastructure"]
counts = [22, 14, 6, 6, 5]
colors = [AMBER, RED, BLUE, GREEN, GREY]

bars = ax1.barh(classes[::-1], counts[::-1], color=colors[::-1], height=0.6)
for bar, n in zip(bars, counts[::-1]):
    ax1.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2,
             str(n), va="center", ha="left", color=FG, fontsize=14, fontweight="bold")

ax1.set_xlim(0, 26)
ax1.set_title("53 changes, all recorded", color=FG, fontsize=14, pad=16,
              fontweight="bold", loc="left")
ax1.tick_params(axis="y", colors=FG, labelsize=11.5)
ax1.tick_params(axis="x", colors=MUTED, labelsize=10)
for s in ax1.spines.values():
    s.set_visible(False)
ax1.set_xlabel("entries in the change log", color=MUTED, fontsize=10, labelpad=8)

# ── Right panel: the honest traffic position ────────────────────────────────
ax2 = fig.add_axes([0.53, 0.30, 0.42, 0.52])
ax2.set_facecolor(BG)
ax2.axis("off")
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 10)

ax2.set_title("The honest position on traffic", color=FG, fontsize=14, pad=16,
              fontweight="bold", loc="left")

# column headers
ax2.text(0.0, 9.55, "30 days to 23 Nov  vs  prior 30 days", color=MUTED, fontsize=10)
ax2.text(6.15, 9.55, "before", color=MUTED, fontsize=10, ha="right")
ax2.text(7.75, 9.55, "now", color=MUTED, fontsize=10, ha="right")
ax2.text(10.0, 9.55, "change", color=MUTED, fontsize=10, ha="right")

rows = [
    ("Impressions", "15,072", "16,821", "-10.4%", RED),
    ("Clicks", "100", "178", "-43.8%", RED),
    ("CTR", "0.66%", "1.06%", "-0.40pt", RED),
    ("Avg position", "12.6", "10.1", "-2.5", RED),
]
y = 8.85
for label, now, before, delta, col in rows:
    ax2.text(0.0, y, label, color=FG, fontsize=12)
    ax2.text(6.15, y, before, color=MUTED, fontsize=11, ha="right")
    ax2.text(7.75, y, now, color=FG, fontsize=12, ha="right")
    ax2.text(10.0, y, delta, color=col, fontsize=11, ha="right", fontweight="bold")
    y -= 0.78

ax2.plot([0, 10], [5.15, 5.15], color=GREY, lw=1, alpha=0.5)

ax2.text(0.0, 4.60, "Why, and what can change it", color=FG, fontsize=12,
         fontweight="bold")
ax2.text(0.0, 3.75,
         "Clicks fell about 4x faster than impressions,\n"
         "so a smaller market alone does not explain it.",
         color=MUTED, fontsize=10.5, va="top", linespacing=1.5)

ax2.text(0.0, 2.15, "Four blog pages are 78% of the entire loss:",
         color=FG, fontsize=11, va="top")
ax2.text(0.3, 1.35,
         "GoodLeap    -985\n"
         "Blue Raven  -620\n"
         "Sunrun      -525\n"
         "ADT         -365",
         color=AMBER, fontsize=10.5, va="top", linespacing=1.7, family="monospace")

ax2.text(5.4, 2.15, "Of the measured queries:",
         color=FG, fontsize=11, va="top")
ax2.text(5.7, 1.35,
         "14  demand loss\n"
         "14  ranking loss\n"
         "51  of 67 improved",
         color=GREEN, fontsize=10.5, va="top", linespacing=1.7, family="monospace")

# ── Footnotes, placed clear of both panels ─────────────────────────────────
fig.text(0.5, 0.185,
         "Every entry records what changed, why, how the conclusion was reached, and the evidence behind it — 37 measured, 16 verified, 0 unverified.",
         color=MUTED, fontsize=11, ha="center")
fig.text(0.5, 0.125,
         "14 demand losses need no content work: the position held while the volume fell, so rewriting those pages achieves nothing. That is a recorded rule, not an opinion.",
         color=MUTED, fontsize=11, ha="center")
fig.text(0.5, 0.052,
         "No ranking, traffic or appointment result is claimed for any 26 Nov change before 5 Dec 2026 — that is when a like-for-like 30-day window closes.",
         color=AMBER, fontsize=11.5, fontweight="bold", ha="center")

out = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-26/change-summary-2026-11-26.png"
fig.savefig(out, facecolor=BG, dpi=130)
print("wrote", out)
