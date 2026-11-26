"""Chart the near-winner opportunity: pages stuck on page 2 and the clicks locked behind them."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# Real GSC data, 1 Sep - 22 Nov 2026, pages at position 11-20 with >=30 impressions
pages = [
    ("/blog/adt-solar-complaints", 2972, 19, 11.0),
    ("/blog/cancel-sunrun-solar-contract-before-installation", 1936, 13, 10.7),
    ("/blog/tesla-solar-solarcity-complaints-cancel-2026", 1081, 5, 10.1),
    ("/blog/sunlight-financial-solar-loan-complaints", 853, 2, 11.8),
    ("/blog/solar-contract-rescission-rights", 805, 2, 18.2),
]
labels = [p[0].replace("/blog/", "").replace("-", " ")[:34] for p in pages]
impr = [p[1] for p in pages]
clicks = [p[2] for p in pages]
pos = [p[3] for p in pages]

fig = plt.figure(figsize=(14, 9.5))
fig.patch.set_facecolor("#0D0F14")
gs = fig.add_gridspec(2, 2, height_ratios=[1.15, 1], hspace=0.42, wspace=0.26,
                      left=0.085, right=0.965, top=0.885, bottom=0.085)

ax1 = fig.add_subplot(gs[0, :])
ax1.set_facecolor("#0D0F14")

y = np.arange(len(pages))
h = 0.36

b1 = ax1.barh(y + h/2, impr, h, color="#F97316", label="Impressions", zorder=3)
b2 = ax1.barh(y - h/2, [c * 100 for c in clicks], h, color="#38BDF8",
              label="Clicks (×100 for visibility)", zorder=3)

for yi, v in zip(y + h/2, impr):
    ax1.text(v + 60, yi, f"{v:,}", va="center", fontsize=10, color="#FDBA74", fontweight="bold")
for yi, v, c in zip(y - h/2, impr, clicks):
    ax1.text(c * 100 + 60, yi, f"{c} clicks  ({c/v*100:.2f}% CTR)", va="center",
             fontsize=10, color="#7DD3FC", fontweight="bold")

ax1.set_yticks(y)
ax1.set_yticklabels(labels, color="#D1D5DB", fontsize=10.5)
ax1.invert_yaxis()
ax1.set_xlim(0, 3900)
ax1.tick_params(colors="#9CA3AF", labelsize=10)
for s in ax1.spines.values(): s.set_color("#2A2F3A")
ax1.grid(axis="x", color="#1F242E", linewidth=0.8, zorder=0)
ax1.set_title("Five pages rank at position 10–18 with 7,600 impressions — and convert almost none",
              color="white", fontsize=14.5, fontweight="bold", pad=34, loc="left")
ax1.text(0, 1.10, "These pages are already being shown by Google. They are one position band from the money.",
         transform=ax1.transAxes, color="#9CA3AF", fontsize=10.5)
ax1.legend(loc="lower right", facecolor="#171A21", edgecolor="#2A2F3A",
           labelcolor="#D1D5DB", fontsize=9.5, framealpha=0.95)

# Panel 2: position band distribution
ax2 = fig.add_subplot(gs[1, 0])
ax2.set_facecolor("#0D0F14")
bands = ["1–3\n(top)", "4–10\n(page 1)", "11–20\n(page 2)", "21+\n(page 3+)"]
vals = [4.4, 21.7, 42.2, 31.8]
cols = ["#16A34A", "#84CC16", "#EAB308", "#DC2626"]
bars = ax2.bar(bands, vals, color=cols, zorder=3, width=0.66)
for b, v in zip(bars, vals):
    ax2.text(b.get_x() + b.get_width()/2, v + 1.2, f"{v}%", ha="center",
             fontsize=12, color="white", fontweight="bold")
ax2.set_ylim(0, 56)
ax2.set_ylabel("Share of impressions", color="#9CA3AF", fontsize=10)
ax2.tick_params(colors="#9CA3AF", labelsize=9.5)
for s in ax2.spines.values(): s.set_color("#2A2F3A")
ax2.grid(axis="y", color="#1F242E", linewidth=0.8, zorder=0)
ax2.set_title("Where our impressions actually sit (Q4 2026)", color="white",
              fontsize=12, fontweight="bold", pad=10, loc="left")
ax2.annotate("74% of all impressions\nare on page 2 or worse",
             xy=(2, 42.2), xytext=(0.95, 49.5),
             color="#FDE047", fontsize=9.5, fontweight="bold",
             arrowprops=dict(arrowstyle="->", color="#FDE047", lw=1.4))

# Panel 3: what fixing it is worth
ax3 = fig.add_subplot(gs[1, 1])
ax3.set_facecolor("#0D0F14")
scen = ["Today\n(pos 11–20)", "Move to\npos 5–10", "Move to\npos 1–3"]
cl = [64, 569, 1042]
bars3 = ax3.bar(scen, cl, color=["#3F3F46", "#F59E0B", "#16A34A"], zorder=3, width=0.62)
for b, v in zip(bars3, cl):
    ax3.text(b.get_x() + b.get_width()/2, v - 34, f"{v:,}", ha="center",
             va="top", color="white", fontsize=12, fontweight="bold", zorder=5)
ax3.text(1, 645, "+505 clicks", ha="center", color="#FDE047", fontsize=11, fontweight="bold", zorder=5)
ax3.text(1, 600, "vs today", ha="center", color="#FDE047", fontsize=8.6, zorder=5)
ax3.text(2, 1128, "+978 clicks", ha="center", color="#4ADE80", fontsize=11, fontweight="bold", zorder=5)
ax3.text(2, 1083, "vs today", ha="center", color="#4ADE80", fontsize=8.6, zorder=5)
ax3.set_ylim(0, 1180)
ax3.set_ylabel("Clicks per 3 months", color="#9CA3AF", fontsize=10)
ax3.tick_params(colors="#9CA3AF", labelsize=9.5)
for s in ax3.spines.values(): s.set_color("#2A2F3A")
ax3.grid(axis="y", color="#1F242E", linewidth=0.8, zorder=0)
ax3.set_title("Clicks locked behind these 20 pages", color="white",
              fontsize=12.5, fontweight="bold", pad=10)


fig.text(0.5, 0.012,
         "Source: Google Search Console, sc-domain:breakyoursolarcontract.com, 1 Sep – 22 Nov 2026 (83 days). "
         "CTR estimates use published Google position benchmarks, not a promise of results.",
         ha="center", fontsize=8.2, color="#6B7280")

plt.savefig("/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.png",
            dpi=150, facecolor="#0D0F14", bbox_inches="tight")
print("saved")