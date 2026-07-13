import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowsDir = path.resolve(process.cwd(), ".github", "workflows");

describe("GitHub Actions supply-chain policy", () => {
  it("pins every third-party action to a full commit SHA", () => {
    const violations: string[] = [];
    for (const filename of fs.readdirSync(workflowsDir)) {
      if (!/\.ya?ml$/i.test(filename)) continue;
      const source = fs.readFileSync(path.join(workflowsDir, filename), "utf8");
      for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)) {
        const reference = match[1];
        // Local actions are bound to the checked-out revision. Remote actions
        // must use an immutable 40-character Git commit, not a mutable tag.
        if (reference.startsWith("./")) continue;
        if (!/@[0-9a-f]{40}$/i.test(reference)) {
          violations.push(`${filename}: ${reference}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("fails the raw SEO evidence workflow closed while the repository is public", () => {
    const source = fs.readFileSync(path.join(workflowsDir, "seo-heartbeat.yml"), "utf8");

    expect(source).toMatch(/seo-heartbeat:\s*\n\s*if: github\.event\.repository\.private == true/);
    expect(source).not.toContain("issues: write");
    expect(source).not.toMatch(/gh\s+issue\s+(?:create|edit|comment)/);
  });
});
