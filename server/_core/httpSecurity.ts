import type { NextFunction, Request, Response } from "express";

const PRODUCTION_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://link.myinfinite.ai",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
];

function getProductionCsp(secureRequest: boolean): string {
  return [
    ...PRODUCTION_CSP_DIRECTIVES,
    ...(secureRequest ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function applyHttpSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
  isProduction = process.env.NODE_ENV === "production",
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (isProduction) {
    // HSTS and upgrade-insecure-requests are safe only when Express knows the
    // request arrived over HTTPS. req.secure honors a deliberately configured
    // trusted proxy and does not trust a spoofable forwarding header by itself.
    if (req.secure) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    res.setHeader("Content-Security-Policy", getProductionCsp(req.secure));
  }

  if (
    req.path.startsWith("/api/")
    || req.path.startsWith("/admin")
    || req.path === "/login"
    || req.path === "/seo-command-center"
  ) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
}

export function getReleaseIdentity(
  source: NodeJS.ProcessEnv = process.env,
): { version: string; releaseSha: string } {
  const candidate = (
    source.RELEASE_SHA
    || source.GITHUB_SHA
    || source.COMMIT_SHA
    || ""
  ).trim();
  const releaseSha = /^[a-zA-Z0-9._-]{7,80}$/.test(candidate)
    ? candidate
    : "unknown";
  return { version: "1.0.0", releaseSha };
}
