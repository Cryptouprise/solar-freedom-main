import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("release truth contract", () => {
  it("keeps legacy browser-login compatibility routes inert", () => {
    const source = read("server/routers.ts");
    const browserLogin = source.slice(
      source.indexOf("browserLogin: protectedProcedure"),
      source.indexOf("checkLoginStatus: protectedProcedure"),
    );
    const loginStatus = source.slice(
      source.indexOf("checkLoginStatus: protectedProcedure"),
      source.indexOf("// ── Backlink Manager"),
    );

    expect(browserLogin).toContain("success: false");
    expect(browserLogin).toContain("browser login is disabled");
    expect(browserLogin).not.toMatch(/import\s*\(|chromium|playwright|launchBrowserLogin/);
    expect(loginStatus).toContain("medium: false");
    expect(loginStatus).toContain("linkedin: false");
    expect(loginStatus).toContain("substack: false");
  });

  it("presents publication, backlink, and legacy settings as review-only", () => {
    const source = read("client/src/pages/admin/PressReleaseAdmin.tsx");

    expect(source).toContain("Approval-first mode is enforced");
    expect(source).toContain("External Schedule (Disabled)");
    expect(source).toContain("Legacy Distribution Adapters (Inactive)");
    expect(source).toContain("Every result is unverified");
    expect(source).toContain("Approve after verification");
    expect(source).not.toContain("automatically generated and submitted");
    expect(source).not.toContain("pre-vetted PR sites");
    expect(source).not.toMatch(/\bDA (?:90|95|98)\b/);
    expect(source).not.toContain("trpc.pressRelease.browserLogin");
    expect(source).not.toContain("description: e.message");
    expect(source).not.toMatch(/title=\{[^}]*errorMessage/);
    expect(source).toContain("No third-party distribution credentials are accepted, stored, or used");
    expect(source).not.toMatch(/PRLOG_|NEWSBYWIRE_|OPENPR_|substack_url/);
    expect(source).not.toContain("Win Contract Cancellations in Record Numbers");
    expect(source).not.toContain("successful submissions");
    expect(source).toContain("adapter-reported successes");
  });

  it("keeps Blog Studio output, research, image, and structure checks honest", () => {
    const source = read("client/src/pages/admin/BlogStudio.tsx");
    const router = read("server/routers.ts");

    expect(source).toContain("The model has no live web access");
    expect(source).toContain("[SOURCE REQUIRED]");
    expect(source).toContain("Unverified AI Output");
    expect(source).toContain("does not satisfy the editorial evidence or publication gate");
    expect(source).toContain("Platform Image Draft");
    expect(source).toContain("Review Structure");
    expect(source).toContain("Phrase frequency is descriptive only");
    expect(source).toContain('useState("more_direct")');
    expect(source).toContain("source-gated intro explaining which agreement records to review");
    expect(source).not.toContain("AI Research");
    expect(source).not.toContain("key facts, statistics");
    expect(source).not.toContain("SEO {score}/100");
    expect(source).not.toContain("Analyze SEO");
    expect(source).not.toContain("More Aggressive / Urgent");
    expect(source).not.toContain("More Authoritative");
    expect(source).not.toContain("more_aggressive");
    expect(source).not.toContain("solar contracts trap homeowners");
    expect(source).not.toContain("imageModel");
    expect(source).not.toMatch(/(?:err|error)\.message/);

    expect(router).toContain("These describe the draft; they do not model rankings");
    expect(router).toContain("no universal target density");
    expect(router).not.toContain("for better rankings");
    expect(router).not.toContain("aim for 5-8 internal links");
    expect(router).not.toContain("aim for 0.8-1.5%");
  });

  it("makes new content draft-first in the legacy admin editor", () => {
    const source = read("client/src/pages/AdminContent.tsx");

    expect(source).toContain("New posts are saved as drafts");
    expect(source).toContain("evidence-first editorial review");
    expect(source).toContain("trpc.content.listAllPosts.useQuery");
    expect(source).toContain("trpc.content.getAdminPost.useQuery");
    expect(source).toContain("editorialReviewerName");
    expect(source).toContain("editorialPrimarySources");
    expect(source).toContain("editorialUniqueValueSummary");
    expect(source).toContain("Request public eligibility on save");
    expect(source).toContain("Create drafts only");
    expect(source).toContain("[SOURCE REQUIRED]");
    expect(source).toContain("published: false");
    expect(source).not.toContain("published: true");
    expect(source).not.toContain("Publish immediately");
    expect(source).not.toContain("Publish Post");
    expect(source).not.toContain("Claude System Prompt");
    expect(source).not.toContain("Tone: authoritative, empathetic, urgent");
    expect(source).not.toContain("Always include FAQ sections");
    expect(source).not.toContain("Target 1,200-2,000 words");
  });

  it("does not echo provider failures in the analytics UI", () => {
    const source = read("client/src/pages/AdminAnalytics.tsx");

    expect(source).toContain("GA4 data is unavailable");
    expect(source).not.toContain("error.message");
  });

  it("labels May SEO reports as dated evidence instead of current proof", () => {
    const ctr = read("docs/SEO-CTR-OPPORTUNITIES-MAY-2026.md");
    const audit = read("docs/SEO-AUDIT-MAY-2026.md");

    for (const source of [ctr, audit]) {
      expect(source).toContain("Historical, unverified snapshot");
      expect(source).toContain("not a current release claim");
    }

    expect(ctr).not.toContain("## Your #1 Rankings");
    expect(ctr).not.toContain("Google will crawl queued URLs");
    expect(ctr).not.toContain("This is a pure meta description problem");
    expect(audit).not.toContain("builds domain authority");
    expect(audit).not.toContain("one or two backlinks could push it to top 3");
    expect(audit).not.toContain("the CTR should jump significantly");
  });
});
