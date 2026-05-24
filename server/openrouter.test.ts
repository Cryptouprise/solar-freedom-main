/**
 * Validates that the OPENROUTER_API_KEY environment variable is set and
 * can successfully reach the OpenRouter API (models list endpoint — no tokens consumed).
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";

const describeOpenRouter = process.env.OPENROUTER_API_KEY ? describe : describe.skip;

describeOpenRouter("OpenRouter API Key", () => {
  it("should have OPENROUTER_API_KEY set", () => {
    expect(process.env.OPENROUTER_API_KEY).toBeTruthy();
    expect(process.env.OPENROUTER_API_KEY!.length).toBeGreaterThan(10);
  });

  it("should successfully authenticate with OpenRouter", async () => {
    const key = process.env.OPENROUTER_API_KEY!;
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://breakyoursolarcontract.com",
      },
    });
    expect(response.status).toBe(200);
    const data = await response.json() as { data: unknown[] };
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  }, 15000);
});
