import fs from "node:fs/promises";
import { chromium } from "playwright";
import { reviewPageAppearance } from "../server/pageVisualReview";
if (process.env.RUN_LIVE_PAGE_APPEARANCE !== "1") throw new Error("Live model check is opt-in: RUN_LIVE_PAGE_APPEARANCE=1");
const output = "/home/ubuntu/solar-freedom-deliverables/visual-quality-2026-11-03";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const targets = [
  { path: "/cancel-solar-contract/houston-tx", width: 390, height: 844 },
  { path: "/blog/how-to-get-out-of-a-solar-contract", width: 1440, height: 900 },
];
const results: unknown[] = [];
try {
  for (const target of targets) {
    const context = await browser.newContext({ viewport: { width: target.width, height: target.height }, reducedMotion: "reduce" });
    await context.addInitScript("window.__name = function(fn) { return fn; };");
    await context.route("**/*", route => { const req = route.request(); if (/google-analytics|analytics\.google|googletagmanager|\/api\/journey\/|\/api\/trpc\/leads\./.test(req.url()) || req.method() !== "GET" && !req.url().includes("/api/trpc/")) return route.abort(); return route.continue(); });
    const page = await context.newPage();
    const response = await page.goto(`http://localhost:3000${target.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (response?.status() !== 200) throw new Error(`Exact page ${target.path} returned ${response?.status()}`);
    await page.waitForTimeout(2000); await page.evaluate(() => document.fonts.ready);
    const captures: { position: "top" | "middle" | "bottom"; image: string }[] = [];
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const [position, top] of [["top", 0], ["middle", Math.max(0, (fullHeight - target.height) / 2)], ["bottom", Math.max(0, fullHeight - target.height)]] as const) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.waitForTimeout(1200);
      const buffer = await page.screenshot({ type: "jpeg", quality: 75, mask: [page.locator("input,textarea,select,iframe,[data-private]")] });
      await fs.writeFile(`${output}/${target.path.split("/").pop()}-${target.width}-${position}.jpg`, buffer);
      captures.push({ position, image: `data:image/jpeg;base64,${buffer.toString("base64")}` });
    }
    const evidence = await page.evaluate(() => {
      const root = document.querySelector("[data-priority-city-guide],main,article") || document.body;
      const visible = (el: Element) => { const b = el.getBoundingClientRect(), s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
      const images = Array.from(root.querySelectorAll("img")).filter(visible);
      return { title: document.title.slice(0, 300), headings: Array.from(root.querySelectorAll("h1,h2,h3")).filter(visible).slice(0, 60).map(el => (el.textContent || "").trim().slice(0, 250)), paragraphWords: Array.from(root.querySelectorAll("p")).filter(visible).slice(0, 300).map(el => (el.textContent || "").trim().split(/\s+/).filter(Boolean).length), imageCount: images.length, brokenImages: images.filter(img => img.complete && img.naturalWidth === 0).length, missingAlt: images.filter(img => !img.hasAttribute("alt")).length, horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 4, ctas: Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(a => visible(a) && /review|qualify|book|call|chat|appointment/i.test(a.textContent || "")).slice(0, 40).map(a => ({ text: (a.textContent || "").trim().slice(0, 200), target: a.href.slice(0, 500), top: Math.round(a.getBoundingClientRect().top + scrollY), visible: a.getBoundingClientRect().top < innerHeight && a.getBoundingClientRect().bottom > 0 })), limitations: ["Headless Chromium screenshots; inputs and cross-origin iframes masked. No forms, appointments or outbound messages submitted.", "Three viewports sampled vertically; the full continuous page and other widths were not reviewed in this request."] };
    });
    const result = await reviewPageAppearance({ path: target.path, viewport: { width: target.width, height: target.height }, capturedAt: new Date().toISOString(), captureMethod: "browser_screenshot", captures, evidence }, "bounded-live-acceptance");
    results.push(result); await fs.writeFile(`${output}/argon-page-review-receipts.json`, JSON.stringify(results, null, 2) + "\n");
    console.log(`${target.path} ${target.width}px: ${result.assessment.verdict}; receipt #${result.actionId}; ${result.assessment.issues.length} observed issues; cost ${result.costUsd ?? "unknown"}`);
    await context.close();
  }
} finally { await browser.close(); }
