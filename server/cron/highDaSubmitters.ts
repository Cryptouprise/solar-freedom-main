/**
 * High-DA Platform Submitters (Playwright + Google OAuth)
 *
 * These platforms use Google login, which is already authenticated in the
 * persistent browser profile from prior GSC/Google sessions.
 *
 * Sites covered:
 *   - Medium.com (DA 95) — publishes as a story on your account
 *   - LinkedIn Articles (DA 98) — publishes as a long-form article
 *   - Substack (DA 90) — publishes as a post to your newsletter
 *
 * IMPORTANT: These require the user to be logged in via the browser profile.
 * On first run, if not logged in, the submitter will return "skipped" with
 * instructions. Log in once via the admin panel's "Authenticate" button and
 * the session is saved permanently.
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

// Shared persistent profile directory (same as prWireSubmitters)
const PROFILE_DIR = join(process.cwd(), ".playwright-profile");
const STORAGE_STATE_FILE = join(PROFILE_DIR, "storage-state.json");
mkdirSync(PROFILE_DIR, { recursive: true });

export interface HighDaResult {
  site: string;
  siteLabel: string;
  status: "success" | "failed" | "skipped" | "needs_login";
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
    const storageState = existsSync(STORAGE_STATE_FILE) ? STORAGE_STATE_FILE : undefined;
    _context = await _browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      storageState,
    });
  }
  return { browser: _browser, context: _context };
}

async function saveStorageState(context: BrowserContext): Promise<void> {
  try {
    await context.storageState({ path: STORAGE_STATE_FILE });
  } catch (_) {
    // Non-critical — just means session won't persist
  }
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

// ─── Format press release as Markdown for Medium/LinkedIn ────────────────────

function formatAsMarkdown(pr: GeneratedPR): string {
  return `# ${pr.headline}

## ${pr.subheadline}

${pr.body}

---

${pr.boilerplate}`;
}

// ─── Medium.com (DA 95) ───────────────────────────────────────────────────────

export async function submitToMedium(pr: GeneratedPR): Promise<HighDaResult> {
  const site = "medium";
  const siteLabel = "Medium.com";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    // Check if logged in by visiting Medium
    await page.goto("https://medium.com/new-story", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // If redirected to sign-in page, we need login
    if (page.url().includes("signin") || page.url().includes("login") || page.url().includes("m/signin")) {
      const screenshotPath = await takeScreenshot(context, "medium-needs-login");
      await page.close();
      return {
        site,
        siteLabel,
        status: "needs_login",
        errorMessage: "Not logged into Medium. Click 'Authenticate Medium' in the admin panel to log in once.",
        screenshotPath,
      };
    }

    // Wait for the editor to load
    await page.waitForSelector('[data-testid="editor"], .notranslate.DraftEditor-content, [contenteditable="true"]', {
      timeout: 15000,
    });

    // Click on the title area and type the headline
    const titleArea = page.locator('[data-testid="storyTitle"], h3[data-testid="storyTitle"], .graf--title').first();
    if (await titleArea.isVisible()) {
      await titleArea.click();
      await titleArea.fill(pr.headline);
    }

    // Press Enter to move to body
    await page.keyboard.press("Enter");

    // Type the body content
    const bodyContent = `${pr.subheadline}\n\n${pr.body}\n\n${pr.boilerplate}`;
    await page.keyboard.type(bodyContent, { delay: 5 });

    // Wait a moment for autosave
    await page.waitForTimeout(2000);

    // Click Publish button
    const publishBtn = page.locator('button:has-text("Publish"), [data-testid="publishButton"]').first();
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await page.waitForTimeout(1500);

      // Confirm publish in the dialog
      const confirmBtn = page.locator('button:has-text("Publish now"), button:has-text("Publish story")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle", { timeout: 20000 });
      }
    }

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "medium-published");

    // Save session state after successful interaction
    await saveStorageState(context);
    await page.close();

    const success = currentUrl.includes("medium.com/@") || currentUrl.includes("/p/") || !currentUrl.includes("new-story");

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "Could not confirm publication on Medium", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── LinkedIn Articles (DA 98) ────────────────────────────────────────────────

export async function submitToLinkedIn(pr: GeneratedPR): Promise<HighDaResult> {
  const site = "linkedin";
  const siteLabel = "LinkedIn Articles";
  let page;

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    // Navigate to LinkedIn article editor
    await page.goto("https://www.linkedin.com/article/new/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Check if logged in
    if (page.url().includes("login") || page.url().includes("checkpoint") || page.url().includes("authwall")) {
      const screenshotPath = await takeScreenshot(context, "linkedin-needs-login");
      await page.close();
      return {
        site,
        siteLabel,
        status: "needs_login",
        errorMessage: "Not logged into LinkedIn. Click 'Authenticate LinkedIn' in the admin panel to log in once.",
        screenshotPath,
      };
    }

    // Wait for article editor
    await page.waitForSelector('[data-placeholder="Title"], .article-title, [aria-label="Article title"]', {
      timeout: 15000,
    });

    // Fill title
    const titleField = page.locator('[data-placeholder="Title"], .article-title, [aria-label="Article title"]').first();
    await titleField.click();
    await titleField.fill(pr.headline);

    // Fill body
    const bodyField = page.locator('[data-placeholder="Write here…"], .article-body, [aria-label="Article body"]').first();
    if (await bodyField.isVisible()) {
      await bodyField.click();
      const bodyContent = `${pr.subheadline}\n\n${pr.body}\n\n${pr.boilerplate}`;
      await bodyField.fill(bodyContent);
    }

    await page.waitForTimeout(1000);

    // Click Publish
    const publishBtn = page.locator('button:has-text("Publish"), [data-control-name="publish"]').first();
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await page.waitForTimeout(1500);

      // Confirm in dialog if present
      const confirmBtn = page.locator('button:has-text("Publish"), button:has-text("Done")').last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle", { timeout: 20000 });
      }
    }

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "linkedin-published");
    await saveStorageState(context);
    await page.close();

    const success = currentUrl.includes("linkedin.com/pulse/") || currentUrl.includes("/article/");

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "Could not confirm publication on LinkedIn", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── Substack (DA 90) ─────────────────────────────────────────────────────────

export async function submitToSubstack(pr: GeneratedPR, substackUrl?: string): Promise<HighDaResult> {
  const site = "substack";
  const siteLabel = "Substack";
  let page;

  // substackUrl should be like "https://yourname.substack.com"
  const baseUrl = substackUrl || "https://substack.com";

  try {
    const { context } = await getBrowser();
    page = await context.newPage();

    // Navigate to Substack new post
    await page.goto(`${baseUrl}/publish/post`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Check if logged in
    if (page.url().includes("login") || page.url().includes("signin")) {
      const screenshotPath = await takeScreenshot(context, "substack-needs-login");
      await page.close();
      return {
        site,
        siteLabel,
        status: "needs_login",
        errorMessage: "Not logged into Substack. Add your Substack URL in settings and authenticate once via the admin panel.",
        screenshotPath,
      };
    }

    // Wait for editor
    await page.waitForSelector('[placeholder="Title"], .pencraft-editor, [data-testid="post-title"]', {
      timeout: 15000,
    });

    // Fill title
    const titleField = page.locator('[placeholder="Title"], [data-testid="post-title"]').first();
    await titleField.click();
    await titleField.fill(pr.headline);

    // Fill subtitle if available
    const subtitleField = page.locator('[placeholder="Subtitle"], [data-testid="post-subtitle"]').first();
    if (await subtitleField.isVisible()) {
      await subtitleField.fill(pr.subheadline || pr.seoSummary);
    }

    // Fill body
    const bodyField = page.locator('.ProseMirror, [contenteditable="true"]').first();
    if (await bodyField.isVisible()) {
      await bodyField.click();
      await page.keyboard.type(`${pr.body}\n\n${pr.boilerplate}`, { delay: 3 });
    }

    await page.waitForTimeout(1500);

    // Click Publish / Continue
    const publishBtn = page.locator('button:has-text("Continue"), button:has-text("Publish")').first();
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await page.waitForTimeout(2000);

      // Final publish confirmation
      const confirmBtn = page.locator('button:has-text("Publish now"), button:has-text("Send")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForLoadState("networkidle", { timeout: 20000 });
      }
    }

    const currentUrl = page.url();
    const screenshotPath = await takeScreenshot(context, "substack-published");
    await saveStorageState(context);
    await page.close();

    const success = currentUrl.includes("/p/") || (!currentUrl.includes("publish") && currentUrl !== baseUrl);

    return success
      ? { site, siteLabel, status: "success", publishedUrl: currentUrl, screenshotPath }
      : { site, siteLabel, status: "failed", errorMessage: "Could not confirm publication on Substack", screenshotPath };
  } catch (err) {
    if (page && !page.isClosed()) await page.close().catch(() => {});
    return { site, siteLabel, status: "failed", errorMessage: String(err) };
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function closeHighDaBrowser(): Promise<void> {
  if (_context) {
    await _context.close().catch(() => {});
    _context = null;
  }
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}
