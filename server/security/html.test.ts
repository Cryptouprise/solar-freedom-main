import { describe, expect, it } from "vitest";
import { sanitizeStoredHtml } from "./html";

describe("sanitizeStoredHtml", () => {
  it("removes active content, event handlers, inline CSS and unsafe URLs", () => {
    const result = sanitizeStoredHtml(`
      <script>alert(1)</script>
      <h2 onclick="steal()" style="color:red">Useful heading</h2>
      <a href="javascript:alert(1)" target="_blank">bad</a>
      <img src="data:image/svg+xml,evil" onerror="steal()">
      <p><strong>Safe</strong> copy</p>
    `);

    expect(result).not.toMatch(/script|onclick|style=|javascript:|onerror|data:image/i);
    expect(result).toContain("Useful heading");
    expect(result).toContain("<strong>Safe</strong>");
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("keeps safe article links and enforces lazy image loading", () => {
    const result = sanitizeStoredHtml('<a href="/help">Help</a><img src="https://cdn.example/image.png" alt="Roof">');
    expect(result).toContain('href="/help"');
    expect(result).toContain('src="https://cdn.example/image.png"');
    expect(result).toContain('loading="lazy"');
  });
});

