import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function readPage(name: string): string {
  return fs.readFileSync(path.join(ROOT, "client", "src", "pages", name), "utf8");
}

function readRepoFile(...parts: string[]): string {
  return fs.readFileSync(path.join(ROOT, ...parts), "utf8");
}

describe("indexable page claim truth", () => {
  it("keeps the home-sale guide conditional and evidence-led", () => {
    const source = readPage("SellingHouseWithSolar.tsx");

    expect(source).toContain("HOW SOLAR FINANCING CAN AFFECT A HOME SALE");
    expect(source).toContain("The exact issue depends on the documents and parties involved.");
    expect(source).toContain("not promise a path or outcome");
    expect(source).not.toMatch(/1 in 3|\$25K\+|47%/);
    expect(source).not.toContain("the solar loan is blocking the deal");
    expect(source).not.toContain("Most buyers' lenders require all liens to be cleared");
    expect(source).not.toContain("Get a PACE or secured solar loan lien removed");
    expect(source).not.toContain("All the ways to get out of a solar purchase contract");
  });

  it("reports only computed publication inventory and actual gates", () => {
    const source = readPage("Blog.tsx");

    expect(source).toContain("`${allPosts.length}`");
    expect(source).toContain("Publication-eligible articles");
    expect(source).toContain("Sources required");
    expect(source).toContain("Named review required");
    expect(source).not.toContain("118+ Cities");
    expect(source).not.toContain("7–11 min");
    expect(source).not.toContain("Ready to Find Out If You Can Cancel?");
  });

  it("avoids unsupported prevalence, visitor-misconduct, and quiz-outcome claims", () => {
    const howItWorks = readPage("HowItWorks.tsx");
    const salesRecords = readPage("SolarPanelScam.tsx");
    const loanRecords = readPage("SolarLoanHelp.tsx");

    expect(howItWorks).toContain("Start With These Record Clues");
    expect(howItWorks).not.toContain("Most Cases Start With These Clues");

    expect(salesRecords).toContain("Records to Review");
    expect(salesRecords).toContain("FOR INDIVIDUAL REVIEW");
    expect(salesRecords).not.toContain("The Playbook They Used On You");
    expect(salesRecords).not.toContain("IN 60 SECONDS");

    expect(loanRecords).toContain(
      "Answer five short questions to organize the agreement type and record categories for individual review."
    );
    expect(loanRecords).not.toContain("see what options are available");
  });

  it("keeps the media hub record-led and links only to verified media destinations", () => {
    const source = readPage("MediaHub.tsx");
    const videoData = source.slice(
      source.indexOf("const VIDEOS ="),
      source.indexOf("const COMPANY_LINKS =")
    );

    expect(source).toContain("SOLAR AGREEMENT RECORD REVIEW");
    expect(source).toContain("RECORD REVIEW HUB");
    expect(source).toContain("THREE REVIEW AREAS");
    expect(source).toContain("EXPLORE PUBLIC RESOURCES");
    expect(videoData).not.toMatch(
      /ESCAPING THE SOLAR TRAP|How Solar Contracts Work & How to Get Out|Solar Fraud|Sunrun Cancellation|GoodLeap Loan Reduction/
    );
    expect(source).not.toMatch(
      /UNDERSTAND YOUR RIGHTS|THEN TAKE ACTION|THE THREE OUTCOMES|WHAT YOU COULD|WALK AWAY WITH|EVERYTHING YOU NEED TO KNOW/
    );
    expect(source).not.toMatch(
      /open\.spotify\.com|podcasts\.apple\.com|cancelyoursolar\.co|FIND US AT BOTH DOMAINS/
    );
    expect(source).toContain("VIDEO SOURCE CHANNEL");
    expect(source).toContain("https://www.youtube.com/@BossAIBiz");
    expect(source).not.toContain("https://www.youtube.com/@SolarFreedom");
  });

  it("uses record-review language consistently in media metadata", () => {
    const prerender = readRepoFile("scripts", "prerender.mjs");
    const serverMeta = readRepoFile("server", "seo-meta.ts");

    for (const source of [prerender, serverMeta]) {
      expect(source).toContain("Solar Contract Record Review Hub");
      expect(source).not.toContain("Solar Contract Truth Hub");
    }
  });
});
