import type { Express } from "express";
import { ENV } from "./env";
import { logSafeError } from "./safeLog";

// These are the only legacy proxy-backed assets referenced by public content.
// New uploads receive their own storage URL and do not require a generic public
// presign endpoint. Keep this exact-key manifest immutable and review additions.
const PUBLIC_STORAGE_KEYS = new Set([
  "ff-attorney-contracts-review_1d59e4bb.png",
  "ff-special-circumstance-addendum_57e25bb3.png",
  "sunrun-texas-investigation-video_0dcbae46.mp4",
  "freedom-forever-investigation-texas_f07bc483.png",
  "ff-breaking-solar-contracts-video_aed64619.mp4",
]);

export function isPublicStorageKey(value: unknown): value is string {
  return typeof value === "string" && PUBLIC_STORAGE_KEYS.has(value);
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!isPublicStorageKey(key)) {
      res.status(404).send("Asset not found");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        // Do not read or log the upstream body; it may contain credentials or PII.
        logSafeError(
          "storage_proxy.upstream_rejected",
          new Error("Upstream rejected storage request"),
          { upstreamStatus: forgeResp.status },
        );
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      let redirectUrl: URL;
      try {
        redirectUrl = new URL(url);
      } catch {
        res.status(502).send("Invalid signed URL from backend");
        return;
      }
      if (
        redirectUrl.protocol !== "https:"
        || redirectUrl.username
        || redirectUrl.password
      ) {
        res.status(502).send("Invalid signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.set("Referrer-Policy", "no-referrer");
      res.redirect(307, redirectUrl.toString());
    } catch (err) {
      logSafeError("storage_proxy.request_failed", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
