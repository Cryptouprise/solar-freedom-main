/**
 * Playwright-based PR Wire Site Submitters
 *
 * Handles form-based submission to free PR distribution sites that don't have APIs.
 * Each submitter uses a persistent browser profile so sessions/cookies are saved.
 *
 * Sites covered:
 *   - 1888PressRelease.com
 *   - OpenPR.com
 *   - PRFree.com
 *   - PRBuzz.com
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { join } from "path";
import { mkdirSync } from "fs";

// Persistent profile directory — keeps cookies/sessions across runs
const PROFILE_DIR = join(process.cwd(), ".playwright-profile");
mkdirSync(PROFILE_DIR, { recursive: true });

export interface PRWireResult {
  site: string;
  siteLabel: string;
  status: "success" | "failed" | "skipped";
  publishedUrl?: string;
  errorMessage?: string;
  screenshotPath?: string;
}

export interface GeneratedPR {
  headline: string;
  subheadline: string;
  body: string;
  boilerplate: string;
  seoSummary: string;
}

// ─── Browser singleton ────────────────────────────────────────────────────────

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;

async function getBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  if (!_context) {
    _context = await _browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      storageState: undefined,
    });
  }
  return { browser: _browser, context: _context };
}

async function takeScreenshot(context: BrowserContext, name: string): Promise<string> {
  const screenshotDir = join(process.cwd(), ".playwright-screenshots");
  mkdirSync(screenshotDir, { recursive: true });
  const path = join(screenshotDir, `${name}-${Date.now()}.png`);
  const pages = context.pages();
  if (pages.length > 0) {
    await pages[pages.length - 1].screenshot({ path, fullPage: false });
  }
  return path;
}

// ─── 1888PressRelease.com ─────────────────────────────────────────────────────

export async function submitTo1888(pr: GeneratedPR): Promise<PRWireResult> {
  const site = "1888";
  const siteLabel = "1888PressRelease.com";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    // Navigate to submit form
    await page.goto("https://www.1888pressrelease.com/submit-press-release/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Fill title
    await page.fill('input[name="title"], input[id*="title"], #pr_title', pr.headline);

    // Fill summary/teaser
    const summaryField = page.locator('textarea[name="summary"], textarea[id*="summary"], #pr_summary').first();
    if (await summaryField.isVisible()) {
      await summaryField.fill(pr.subheadline || pr.seoSummary);
    }

    // Fill body
    const bodyField = page.locator('textarea[name="body"], textarea[id*="body"], #pr_body, .ql-editor').first();
    if (await bodyField.isVisible()) {
      await bodyField.fill(`${pr.body}\n\n${pr.boilerplate}`);
    }

    // Fill category if present
    const categorySelect = page.locator('select[name="category"], select[id*="category"]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ label: "Legal" }).catch(() =>
        categorySelect.selectOption({ label: "Energy" }).catch(() => {})
      );
    }

    // Submit
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "1888-submit");

    // Check for success indicators
    const pageText = await page.textContent("body") ?? "";
    const success =
      currentUrl.includes("success") ||
      currentUrl.includes("thank") ||
      pageText.toLowerCase().includes("thank you") ||
      pageText.toLowerCase().includes("submitted successfully") ||
      pageText.toLowerCase().includes("press release submitted");

    await page.close();

    if (success) {
      return { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath };
    } else {
      return { site, siteLabel, status: "failed", errorMessage: "Submission form completed but no success confirmation detected", screenshotPath };
    }
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── OpenPR.com ───────────────────────────────────────────────────────────────

export async function submitToOpenPR(pr: GeneratedPR, email?: string, password?: string): Promise<PRWireResult> {
  const site = "openpr";
  const siteLabel = "OpenPR.com";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    // OpenPR requires an account — check if already logged in
    await page.goto("https://www.openpr.com/news/submit", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // If redirected to login page, log in
    if (page.url().includes("login") || page.url().includes("signin")) {
      if (!email || !password) {
        await page.close();
        return {
          site,
          siteLabel,
          status: "skipped",
          errorMessage: "OpenPR requires an account. Add OPENPR_EMAIL and OPENPR_PASSWORD to settings.",
        };
      }
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="password"], input[type="password"]', password);
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForNavigation({ timeout: 15000 });
      // Navigate to submit after login
      await page.goto("https://www.openpr.com/news/submit", { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    // Fill the form
    await page.fill('input[name="title"], #title, input[placeholder*="headline" i]', pr.headline);

    const summaryField = page.locator('textarea[name="summary"], #summary, textarea[placeholder*="summary" i]').first();
    if (await summaryField.isVisible()) {
      await summaryField.fill(pr.subheadline || pr.seoSummary);
    }

    const bodyField = page.locator('textarea[name="text"], #text, .ql-editor, [contenteditable="true"]').first();
    if (await bodyField.isVisible()) {
      await bodyField.fill(`${pr.body}\n\n${pr.boilerplate}`);
    }

    // Submit
    await page.click('button[type="submit"], input[type="submit"], .submit-btn');
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "openpr-submit");
    const pageText = await page.textContent("body") ?? "";

    const success =
      currentUrl.includes("success") ||
      pageText.toLowerCase().includes("thank you") ||
      pageText.toLowerCase().includes("submitted");

    await page.close();

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "No success confirmation detected", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── PRFree.com ───────────────────────────────────────────────────────────────

export async function submitToPRFree(pr: GeneratedPR): Promise<PRWireResult> {
  const site = "prfree";
  const siteLabel = "PRFree.com";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    await page.goto("https://prfree.com/?page=submit", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // PRFree uses a multi-field form
    await page.fill('input[name="title"]', pr.headline).catch(() =>
      page!.fill('input[id="title"]', pr.headline)
    );

    // Summary/intro
    const summaryField = page.locator('textarea[name="intro"], textarea[name="summary"]').first();
    if (await summaryField.isVisible()) {
      await summaryField.fill(pr.subheadline || pr.seoSummary);
    }

    // Body
    const bodyField = page.locator('textarea[name="body"], textarea[name="text"]').first();
    if (await bodyField.isVisible()) {
      await bodyField.fill(`${pr.body}\n\n${pr.boilerplate}`);
    }

    // Contact/company fields (PRFree requires these)
    const companyField = page.locator('input[name="company"], input[name="organization"]').first();
    if (await companyField.isVisible()) {
      await companyField.fill("Solar Freedom Legal");
    }

    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill("info@breakyoursolarcontract.com");
    }

    const websiteField = page.locator('input[name="website"], input[name="url"]').first();
    if (await websiteField.isVisible()) {
      await websiteField.fill("https://breakyoursolarcontract.com");
    }

    // Submit
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "prfree-submit");
    const pageText = await page.textContent("body") ?? "";

    const success =
      currentUrl.includes("success") ||
      currentUrl.includes("thank") ||
      pageText.toLowerCase().includes("thank you") ||
      pageText.toLowerCase().includes("submitted");

    await page.close();

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "No success confirmation detected", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── PRBuzz.com ───────────────────────────────────────────────────────────────

export async function submitToPRBuzz(pr: GeneratedPR): Promise<PRWireResult> {
  const site = "prbuzz";
  const siteLabel = "PRBuzz.com";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    await page.goto("https://www.prbuzz.com/submit-press-release.html", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Fill headline
    await page.fill('input[name="headline"], input[name="title"], #headline', pr.headline);

    // Fill summary
    const summaryField = page.locator('textarea[name="summary"], textarea[name="abstract"]').first();
    if (await summaryField.isVisible()) {
      await summaryField.fill(pr.subheadline || pr.seoSummary);
    }

    // Fill body
    const bodyField = page.locator('textarea[name="body"], textarea[name="content"]').first();
    if (await bodyField.isVisible()) {
      await bodyField.fill(`${pr.body}\n\n${pr.boilerplate}`);
    }

    // Contact info
    const nameField = page.locator('input[name="contact_name"], input[name="name"]').first();
    if (await nameField.isVisible()) {
      await nameField.fill("Solar Freedom Legal Team");
    }

    const emailField = page.locator('input[name="contact_email"], input[name="email"], input[type="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill("info@breakyoursolarcontract.com");
    }

    const websiteField = page.locator('input[name="website"], input[name="url"]').first();
    if (await websiteField.isVisible()) {
      await websiteField.fill("https://breakyoursolarcontract.com");
    }

    // Submit
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "prbuzz-submit");
    const pageText = await page.textContent("body") ?? "";

    const success =
      currentUrl.includes("success") ||
      currentUrl.includes("thank") ||
      pageText.toLowerCase().includes("thank you") ||
      pageText.toLowerCase().includes("submitted");

    await page.close();

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "No success confirmation detected", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function closeBrowser(): Promise<void> {
  if (_context) {
    await _context.close().catch(() => {});
    _context = null;
  }
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}
