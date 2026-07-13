/**
 * browserLoginSession.ts
 *
 * Launches a visible (non-headless) Playwright browser window so the admin can
 * manually log in to Medium, LinkedIn, or Substack. Once the user completes
 * login, the session cookies are saved to the persistent profile directory so
 * all future automated press release submissions work without re-authentication.
 *
 * The procedure runs server-side in the sandbox, which has a display available
 * via Xvfb. The browser opens, the user logs in, and after 3 minutes (or when
 * the page navigates to the expected post-login URL) the session is saved and
 * the browser closes.
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { join } from "path";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { hasExpectedCookieDomain } from "../../shared/urlSafety";
import { getBrowserRuntimeDir, secureBrowserStateFile } from "./browserState";
import { logSafeError } from "../_core/safeLog";

const PROFILE_DIR = getBrowserRuntimeDir("high-da");
const STORAGE_STATE_FILE = join(PROFILE_DIR, "storage-state.json");
const LOGIN_STATUS_FILE = join(PROFILE_DIR, "login-status.json");
mkdirSync(PROFILE_DIR, { recursive: true, mode: 0o700 });

export type LoginSite = "medium" | "linkedin" | "substack";

interface SiteConfig {
  loginUrl: string;
  successUrlPattern: RegExp;
  label: string;
}

const SITE_CONFIGS: Record<LoginSite, SiteConfig> = {
  medium: {
    loginUrl: "https://medium.com/m/signin",
    successUrlPattern: /medium\.com\/?(\?|$|@)/,
    label: "Medium",
  },
  linkedin: {
    loginUrl: "https://www.linkedin.com/login",
    successUrlPattern: /linkedin\.com\/feed/,
    label: "LinkedIn",
  },
  substack: {
    loginUrl: "https://substack.com/sign-in",
    successUrlPattern: /substack\.com\/publish|substack\.com\/@/,
    label: "Substack",
  },
};

interface LoginStatus {
  medium: boolean;
  linkedin: boolean;
  substack: boolean;
  lastChecked: string;
}

function readLoginStatus(): LoginStatus {
  try {
    if (existsSync(LOGIN_STATUS_FILE)) {
      return JSON.parse(readFileSync(LOGIN_STATUS_FILE, "utf-8"));
    }
  } catch (_) {}
  return { medium: false, linkedin: false, substack: false, lastChecked: new Date().toISOString() };
}

function saveLoginStatus(status: Partial<LoginStatus>) {
  const current = readLoginStatus();
  const updated = { ...current, ...status, lastChecked: new Date().toISOString() };
  writeFileSync(LOGIN_STATUS_FILE, JSON.stringify(updated, null, 2), { mode: 0o600 });
  secureBrowserStateFile(LOGIN_STATUS_FILE);
}

/**
 * Check whether each site is logged in by loading the storage state and
 * inspecting cookies/localStorage for session markers.
 */
export async function checkLoginStatus(): Promise<LoginStatus> {
  const status = readLoginStatus();
  
  if (!existsSync(STORAGE_STATE_FILE)) {
    return { medium: false, linkedin: false, substack: false, lastChecked: new Date().toISOString() };
  }

  try {
    const storageState = JSON.parse(readFileSync(STORAGE_STATE_FILE, "utf-8"));
    const cookies: Array<{ domain: string; name: string }> = storageState.cookies ?? [];

    const hasMedium = cookies.some(
      (c) => hasExpectedCookieDomain(c.domain, "medium.com") && (c.name === "uid" || c.name === "sid")
    );
    const hasLinkedIn = cookies.some(
      (c) => hasExpectedCookieDomain(c.domain, "linkedin.com") && (c.name === "li_at" || c.name === "JSESSIONID")
    );
    const hasSubstack = cookies.some(
      (c) => hasExpectedCookieDomain(c.domain, "substack.com") && (c.name === "substack.sid" || c.name === "connect.sid")
    );

    const updated = {
      medium: hasMedium,
      linkedin: hasLinkedIn,
      substack: hasSubstack,
      lastChecked: new Date().toISOString(),
    };
    saveLoginStatus(updated);
    return updated;
  } catch (_) {
    return status;
  }
}

/**
 * Launch a browser session for the admin to log in to the given site.
 * The browser opens in non-headless mode (visible) using the sandbox display.
 * After the user logs in and the success URL is detected (or after 3 min timeout),
 * the session is saved and the browser closes.
 */
export async function launchBrowserLoginSession(
  site: LoginSite
): Promise<{ success: boolean; message: string; loginUrl: string }> {
  const config = SITE_CONFIGS[site];

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Load existing storage state so we don't lose other sites' sessions
    const storageState = existsSync(STORAGE_STATE_FILE) ? STORAGE_STATE_FILE : undefined;

    browser = await chromium.launch({
      headless: false, // Visible browser so the admin can log in
      args: [
        "--disable-dev-shm-usage",
        "--start-maximized",
      ],
      env: {
        ...process.env,
        DISPLAY: process.env.DISPLAY ?? ":99",
      },
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      storageState,
    });

    const page = await context.newPage();
    await page.goto(config.loginUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });

    console.log(`[BrowserLogin] Opened ${config.label} login page. Waiting for user to log in...`);

    // Wait up to 3 minutes for the user to complete login
    const MAX_WAIT_MS = 3 * 60 * 1000;
    const CHECK_INTERVAL_MS = 2000;
    const deadline = Date.now() + MAX_WAIT_MS;
    let loggedIn = false;

    while (Date.now() < deadline) {
      await page.waitForTimeout(CHECK_INTERVAL_MS);
      const currentUrl = page.url();
      if (config.successUrlPattern.test(currentUrl)) {
        loggedIn = true;
        console.log(`[BrowserLogin] ${config.label} login detected`);
        break;
      }
    }

    // Save session regardless of whether we detected success — user may have
    // logged in but the URL pattern didn't match exactly
    await context.storageState({ path: STORAGE_STATE_FILE });
    secureBrowserStateFile(STORAGE_STATE_FILE);
    console.log("[BrowserLogin] Session state saved outside the repository");

    // Update login status
    const statusUpdate: Partial<LoginStatus> = {};
    statusUpdate[site] = loggedIn;
    saveLoginStatus(statusUpdate);

    await context.close();
    await browser.close();

    if (loggedIn) {
      return {
        success: true,
        message: `Successfully logged in to ${config.label}. Session state was saved for a future approval-bound worker.`,
        loginUrl: config.loginUrl,
      };
    } else {
      return {
        success: false,
        message: `Browser closed after 3-minute timeout. If you completed login, the session may still be saved. Try running a press release to verify.`,
        loginUrl: config.loginUrl,
      };
    }
  } catch (err) {
    logSafeError("browser_login.failed", err);

    try {
      if (context) await context.storageState({ path: STORAGE_STATE_FILE });
      secureBrowserStateFile(STORAGE_STATE_FILE);
    } catch (_) {}
    try {
      if (context) await context.close();
    } catch (_) {}
    try {
      if (browser) await browser.close();
    } catch (_) {}

    return {
      success: false,
      message: "Browser login failed. No session was approved for automated publishing.",
      loginUrl: config.loginUrl,
    };
  }
}
