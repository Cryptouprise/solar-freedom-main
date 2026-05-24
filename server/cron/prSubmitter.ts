/**
 * Press Release Submitter — Playwright-based browser automation
 *
 * Handles submission to all free press release distribution sites.
 * Uses a persistent browser profile so login sessions survive across runs.
 *
 * Sites covered (all free):
 *   1. PRLog.com          — Playwright (account required)
 *   2. NewsByWire.com     — Playwright (account required)
 *   3. OpenPR.com         — Playwright (account required)
 *   4. 1888PressRelease   — Playwright (account required)
 *   5. PRFree.com         — Playwright (account required)
 *   6. PRBuzz.com         — Playwright (account required)
 *   7. Free-Press-Release — Playwright (account required)
 *   8. PRUrgent.com       — Playwright (account required)
 *   9. ClickPress.com     — Playwright (account required)
 *  10. i-Newswire.com     — Playwright (account required)
 *
 * All sessions are stored in /home/ubuntu/.pr-browser-profile so logins persist.
 * The admin can click "Login to [site]" from the admin panel to authenticate once.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PRContent {
  headline: string;
  subheadline: string;
  body: string;
  boilerplate: string;
  keywords?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
}

export interface SiteSubmissionResult {
  site: string;
  siteLabel: string;
  status: "success" | "failed" | "skipped" | "needs_login";
  publishedUrl?: string;
  screenshotPath?: string;
  errorMessage?: string;
  durationMs?: number;
}

// ─── Browser profile ──────────────────────────────────────────────────────────

const PROFILE_DIR = "/home/ubuntu/.pr-browser-profile";

function ensureProfileDir() {
  if (!existsSync(PROFILE_DIR)) {
    mkdirSync(PROFILE_DIR, { recursive: true });
  }
}

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;

export async function getBrowserContext(): Promise<BrowserContext> {
  ensureProfileDir();

  if (!_context) {
    _browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    _context = await _browser.newContext({
      storageState: existsSync(join(PROFILE_DIR, "state.json"))
        ? join(PROFILE_DIR, "state.json")
        : undefined,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });
  }

  return _context;
}

export async function saveSession(): Promise<void> {
  if (_context) {
    await _context.storageState({ path: join(PROFILE_DIR, "state.json") });
  }
}

export async function closeBrowser(): Promise<void> {
  await saveSession();
  await _context?.close();
  await _browser?.close();
  _context = null;
  _browser = null;
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotDir = "/home/ubuntu/.pr-screenshots";
  if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });
  const path = join(screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

// ─── Default PR content values ────────────────────────────────────────────────

function withDefaults(pr: PRContent): Required<PRContent> {
  return {
    ...pr,
    keywords: pr.keywords ?? "solar contract cancellation, solar energy, consumer protection, solar contract rights",
    contactName: pr.contactName ?? "Solar Freedom Media",
    contactEmail: pr.contactEmail ?? "media@breakyoursolarcontract.com",
    contactPhone: pr.contactPhone ?? "",
    websiteUrl: pr.websiteUrl ?? "https://breakyoursolarcontract.com",
    city: pr.city ?? "Jacksonville",
    state: pr.state ?? "FL",
    country: pr.country ?? "US",
    industry: pr.industry ?? "Legal Services",
  };
}

// ─── Site 1: PRLog.com ────────────────────────────────────────────────────────

export async function submitToPRLog(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "prlog";
  const siteLabel = "PRLog.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    // Check if already logged in
    await page.goto("https://www.prlog.org/submit/", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Login if needed
    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.goto("https://www.prlog.org/login.html");
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
    }

    // Navigate to submit page
    await page.goto("https://www.prlog.org/submit/", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Fill title
    await page.fill("input[name='title']", p.headline);

    // Fill summary/subheadline
    const summaryField = await page.$("textarea[name='summary']") || await page.$("input[name='summary']");
    if (summaryField) await summaryField.fill(p.subheadline);

    // Fill body
    const bodyField = await page.$("textarea[name='body']") || await page.$("#body");
    if (bodyField) await bodyField.fill(`${p.body}\n\n${p.boilerplate}`);

    // Fill tags/keywords
    const tagsField = await page.$("input[name='tags']") || await page.$("input[name='keywords']");
    if (tagsField) await tagsField.fill(p.keywords);

    // Select industry if dropdown exists
    const industrySelect = await page.$("select[name='industry']");
    if (industrySelect) {
      await page.selectOption("select[name='industry']", { label: "Legal" }).catch(() => {});
    }

    // City/state
    const cityField = await page.$("input[name='city']");
    if (cityField) await cityField.fill(p.city);

    const stateField = await page.$("select[name='state']") || await page.$("input[name='state']");
    if (stateField) {
      if ((await stateField.getAttribute("tagName"))?.toLowerCase() === "select") {
        await page.selectOption("select[name='state']", p.state).catch(() => {});
      } else {
        await (stateField as any).fill(p.state);
      }
    }

    const screenshot = await takeScreenshot(page, "prlog-before-submit");

    // Submit
    const submitBtn = await page.$("input[type='submit'][value*='Submit']") ||
                      await page.$("button[type='submit']") ||
                      await page.$(".submit-btn");
    if (!submitBtn) throw new Error("Could not find submit button on PRLog");

    await submitBtn.click();
    await page.waitForNavigation({ timeout: 30000 });

    // Check for success
    const successUrl = page.url();
    const pageText = await page.textContent("body") ?? "";

    if (successUrl.includes("prlog.org/") && !successUrl.includes("submit") ||
        pageText.toLowerCase().includes("submitted") ||
        pageText.toLowerCase().includes("pending review")) {
      await saveSession();
      return {
        site, siteLabel, status: "success",
        publishedUrl: successUrl,
        screenshotPath: screenshot,
        durationMs: Date.now() - start,
      };
    }

    throw new Error(`Unexpected result page: ${successUrl}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "prlog-error").catch(() => undefined);
    return {
      site, siteLabel, status: "failed",
      screenshotPath: screenshot,
      errorMessage: String(err),
      durationMs: Date.now() - start,
    };
  } finally {
    await page.close();
  }
}

// ─── Site 2: OpenPR.com ───────────────────────────────────────────────────────

export async function submitToOpenPR(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "openpr";
  const siteLabel = "OpenPR.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://www.openpr.com/news/submit", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Login check
    if (await page.$("input[name='email']") || page.url().includes("login")) {
      await page.goto("https://www.openpr.com/login");
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("button[type='submit'], input[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://www.openpr.com/news/submit", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='text'], #text, textarea[name='body']");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const kwField = await page.$("input[name='keywords'], #keywords");
    if (kwField) await kwField.fill(p.keywords);

    const screenshot = await takeScreenshot(page, "openpr-before-submit");

    await page.click("button[type='submit'], input[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (url.includes("openpr.com/news/") || text.toLowerCase().includes("success")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "openpr-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 3: 1888PressRelease.com ────────────────────────────────────────────

export async function submitTo1888(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "1888";
  const siteLabel = "1888PressRelease.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://www.1888pressrelease.com/submit-press-release/", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (await page.$("input[name='username']") || page.url().includes("login")) {
      await page.fill("input[name='username'], input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://www.1888pressrelease.com/submit-press-release/", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #pr_title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], #pr_body, textarea[name='press_release']");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const kwField = await page.$("input[name='keywords'], #keywords");
    if (kwField) await kwField.fill(p.keywords);

    const cityField = await page.$("input[name='city']");
    if (cityField) await cityField.fill(p.city);

    const screenshot = await takeScreenshot(page, "1888-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("submitted") || text.toLowerCase().includes("thank you") || url.includes("success")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "1888-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 4: PRFree.com ───────────────────────────────────────────────────────

export async function submitToPRFree(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "prfree";
  const siteLabel = "PRFree.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://prfree.com/?page=submit", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (await page.$("input[name='email']") || page.url().includes("login")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://prfree.com/?page=submit", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title']", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content']");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "prfree-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("submitted") || text.toLowerCase().includes("success")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "prfree-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 5: PRBuzz.com ───────────────────────────────────────────────────────

export async function submitToPRBuzz(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "prbuzz";
  const siteLabel = "PRBuzz.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://www.prbuzz.com/submit-press-release.html", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://www.prbuzz.com/submit-press-release.html", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content'], #body");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "prbuzz-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "prbuzz-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 6: Free-Press-Release.com ──────────────────────────────────────────

export async function submitToFreePressRelease(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "free-press-release";
  const siteLabel = "Free-Press-Release.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://free-press-release.com/news/submit.cgi", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://free-press-release.com/news/submit.cgi", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title']", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content']");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "fpr-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "fpr-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 7: i-Newswire.com ───────────────────────────────────────────────────

export async function submitToINewswire(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "i-newswire";
  const siteLabel = "i-Newswire.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://i-newswire.com/submit-press-release.html", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://i-newswire.com/submit-press-release.html", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content'], #body");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const kwField = await page.$("input[name='keywords']");
    if (kwField) await kwField.fill(p.keywords);

    const screenshot = await takeScreenshot(page, "inewswire-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted") || url.includes("i-newswire.com/news/")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "inewswire-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 8: PRUrgent.com ─────────────────────────────────────────────────────

export async function submitToPRUrgent(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "prurgent";
  const siteLabel = "PRUrgent.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://www.prurgent.com/submit-press-release.asp", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://www.prurgent.com/submit-press-release.asp", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content'], #body");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "prurgent-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "prurgent-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 9: NewsByWire.com ───────────────────────────────────────────────────

export async function submitToNewsByWirePlaywright(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "newsbywire";
  const siteLabel = "NewsByWire.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://newsbywire.com/submit", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://newsbywire.com/submit", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content'], #body");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "newsbywire-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "newsbywire-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Site 10: ClickPress.com ──────────────────────────────────────────────────

export async function submitToClickPress(
  pr: PRContent,
  credentials: { email: string; password: string }
): Promise<SiteSubmissionResult> {
  const site = "clickpress";
  const siteLabel = "ClickPress.com";
  const start = Date.now();
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();

  try {
    const p = withDefaults(pr);

    await page.goto("https://www.clickpress.com/releases/add/", { waitUntil: "domcontentloaded", timeout: 30000 });

    if (page.url().includes("login") || await page.$("input[name='email']")) {
      await page.fill("input[name='email']", credentials.email);
      await page.fill("input[name='password']", credentials.password);
      await page.click("input[type='submit'], button[type='submit']");
      await page.waitForNavigation({ timeout: 15000 });
      await saveSession();
      await page.goto("https://www.clickpress.com/releases/add/", { waitUntil: "domcontentloaded" });
    }

    await page.fill("input[name='title'], #title", p.headline);

    const bodyArea = await page.$("textarea[name='body'], textarea[name='content'], #body");
    if (bodyArea) await bodyArea.fill(`${p.body}\n\n${p.boilerplate}`);

    const screenshot = await takeScreenshot(page, "clickpress-before-submit");

    await page.click("input[type='submit'], button[type='submit']");
    await page.waitForNavigation({ timeout: 30000 });

    const url = page.url();
    const text = await page.textContent("body") ?? "";

    if (text.toLowerCase().includes("success") || text.toLowerCase().includes("submitted") || url.includes("clickpress.com/releases/")) {
      await saveSession();
      return { site, siteLabel, status: "success", publishedUrl: url, screenshotPath: screenshot, durationMs: Date.now() - start };
    }

    throw new Error(`Unexpected result: ${url}`);
  } catch (err) {
    const screenshot = await takeScreenshot(page, "clickpress-error").catch(() => undefined);
    return { site, siteLabel, status: "failed", screenshotPath: screenshot, errorMessage: String(err), durationMs: Date.now() - start };
  } finally {
    await page.close();
  }
}

// ─── Master submission runner ─────────────────────────────────────────────────

export interface SiteConfig {
  id: string;
  label: string;
  enabled: boolean;
  credentials: { email: string; password: string };
  fn: (pr: PRContent, creds: { email: string; password: string }) => Promise<SiteSubmissionResult>;
}

export async function submitToAllSites(
  pr: PRContent,
  siteConfigs: SiteConfig[]
): Promise<SiteSubmissionResult[]> {
  const results: SiteSubmissionResult[] = [];

  for (const site of siteConfigs) {
    if (!site.enabled) {
      results.push({
        site: site.id,
        siteLabel: site.label,
        status: "skipped",
        errorMessage: "Site disabled in settings",
      });
      continue;
    }

    if (!site.credentials.email || !site.credentials.password) {
      results.push({
        site: site.id,
        siteLabel: site.label,
        status: "needs_login",
        errorMessage: "No credentials configured. Use admin panel to set up login.",
      });
      continue;
    }

    console.log(`[PR Submitter] Submitting to ${site.label}...`);
    try {
      const result = await site.fn(pr, site.credentials);
      results.push(result);
      console.log(`[PR Submitter] ${site.label}: ${result.status}${result.publishedUrl ? ` → ${result.publishedUrl}` : ""}`);
    } catch (err) {
      results.push({
        site: site.id,
        siteLabel: site.label,
        status: "failed",
        errorMessage: String(err),
      });
    }

    // Brief pause between submissions to avoid rate limiting
    await new Promise((r) => setTimeout(r, 3000));
  }

  await closeBrowser();
  return results;
}
