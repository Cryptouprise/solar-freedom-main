"""Chart the real Search Console trend: impressions up, clicks down, position flat."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

months = ["Mar", "Apr", "May", "Jun", "Jul*", "Aug", "Sep", "Oct", "Nov\n(22d)"]
impr = [897, 3563, 10547, 14185, 189, 7517, 17588, 16835, 10878]
clicks = [14, 39, 91, 205, 2, 94, 181, 174, 66]
pos = [12.3, 11.5, 11.8, 11.2, 35.8, 12.9, 10.6, 10.3, 12.6]

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(13, 8.2), sharex=True,
                               gridspec_kw={"height_ratios": [1.55, 1]})
fig.patch.set_facecolor("#0D0F14")

for ax in (ax1, ax2):
    ax.set_facecolor("#0D0F14")
    ax.tick_params(colors="#9CA3AF", labelsize=10)
    for s in ax.spines.values():
        s.set_color("#2A2F3A")
    ax.grid(axis="y", color="#1F242E", linewidth=0.8, zorder=0)

x = np.arange(len(months))
w = 0.38

b1 = ax1.bar(x - w/2, impr, w, color="#F97316", label="Impressions", zorder=3)
ax1.set_ylabel("Impressions", color="#F97316", fontsize=11, fontweight="bold")
ax1.tick_params(axis="y", colors="#F97316")
for xi, v in zip(x, impr):
    ax1.text(xi - w/2, v + 450, f"{v/1000:.1f}k" if v >= 1000 else str(v),
             ha="center", fontsize=8.5, color="#FDBA74", fontweight="bold")

ax1b = ax1.twinx()
ax1b.plot(x, clicks, color="#38BDF8", marker="o", markersize=7, linewidth=2.6,
          label="Clicks", zorder=5)
ax1b.set_ylabel("Clicks", color="#38BDF8", fontsize=11, fontweight="bold")
ax1b.tick_params(axis="y", colors="#38BDF8")
ax1b.set_ylim(0, 240)
for xi, v in zip(x, clicks):
    ax1b.annotate(str(v), (xi, v), textcoords="offset points", xytext=(0, 9),
                  ha="center", fontsize=8.5, color="#7DD3FC", fontweight="bold")

ax1.set_title("breakyoursolarcontract.com — Search Console, Mar–Nov 2026",
              color="white", fontsize=15, fontweight="bold", pad=16, loc="left")
ax1.text(0, 1.035, "Impressions grew 12× then flattened. Clicks peaked in June and are falling.",
         transform=ax1.transAxes, color="#9CA3AF", fontsize=10.5)

ax1.axvspan(-0.5, 0.5, color="#1F242E", alpha=0.55, zorder=0)
ax1.text(0, 15200, "tracking\nstarted", ha="center", fontsize=8, color="#6B7280", style="italic")

# Position panel: lower is better
ax2.plot(x, pos, color="#A78BFA", marker="s", markersize=7, linewidth=2.6, zorder=4)
ax2.set_ylabel("Avg position", color="#A78BFA", fontsize=11, fontweight="bold")
ax2.tick_params(axis="y", colors="#A78BFA")
ax2.invert_yaxis()
ax2.set_ylim(38, 8)
ax2.axhspan(8, 10, color="#16A34A", alpha=0.16, zorder=1)
ax2.axhspan(10, 20, color="#EAB308", alpha=0.13, zorder=1)
ax2.axhspan(20, 38, color="#DC2626", alpha=0.12, zorder=1)
ax2.text(len(months) - 0.45, 9.0, "page 1", fontsize=8.5, color="#4ADE80", ha="right", va="center", fontweight="bold")
ax2.text(len(months) - 0.45, 15.0, "page 2 — 74% of all impressions sit here", fontsize=8.5, color="#FDE047", ha="right", va="center", fontweight="bold")
ax2.text(len(months) - 0.45, 27.0, "page 3+", fontsize=8.5, color="#F87171", ha="right", va="center", fontweight="bold")
for xi, v in zip(x, pos):
    if xi != 4:
        ax2.annotate(f"{v:.1f}", (xi, v), textcoords="offset points", xytext=(0, 11),
                     ha="center", fontsize=8.5, color="#C4B5FD", fontweight="bold")
ax2.set_title("Average ranking position has not moved in nine months",
              color="white", fontsize=13, fontweight="bold", pad=12, loc="left")

ax2.set_xticks(x)
ax2.set_xticklabels(months, color="#9CA3AF", fontsize=10)
ax2.text(4, 8.6, "Jul* = near-total data gap\n(0–12 impressions/day)", fontsize=8,
         color="#6B7280", ha="center", va="top", style="italic")

fig.text(0.5, 0.012,
         "Source: Google Search Console, sc-domain:breakyoursolarcontract.com. Pulled 24 Nov 2026; latest complete day 22 Nov. "
         "July 2026 excluded from trend reading — verification gap, not a real collapse.",
         ha="center", fontsize=8.2, color="#6B7280")

plt.tight_layout(rect=[0, 0.028, 1, 1])
plt.savefig("/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/gsc-trend.png",
            dpi=155, facecolor="#0D0F14", bbox_inches="tight")
print("saved")