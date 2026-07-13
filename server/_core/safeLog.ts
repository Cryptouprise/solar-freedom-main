/**
 * Security-focused logging for failures that may carry credentials or PII.
 *
 * Never serialize the supplied error. Axios errors can contain Authorization
 * headers, request bodies, cookies, and upstream response bodies. Database
 * errors can contain SQL parameters. This helper emits only fixed event names,
 * a coarse error class, allowlisted transport codes, and numeric status data.
 */

const SAFE_EVENTS = new Set([
  "auth.session_verification_failed",
  "auth.user_sync_failed",
  "admin.auth_failed",
  "admin.api_failed",
  "analytics.ga4_fetch_failed",
  "ai_cost.log_failed",
  "ai_cost.provider_cost_unavailable",
  "automation.run_failed",
  "backlink.discovery_failed",
  "blog_studio.image_generation_failed",
  "browser_login.failed",
  "content.blog_post_update_failed",
  "content.site_config_unavailable",
  "database.connect_failed",
  "database.exit_intent_insert_failed",
  "database.lead_insert_failed",
  "database.user_upsert_failed",
  "ghl.webhook_failed",
  "ghl.delivery_marker_failed",
  "oauth.callback_failed",
  "notification.request_failed",
  "press_release.run_failed",
  "seo.db_lookup_failed",
  "seo.inventory_failed",
  "server.readiness_failed",
  "server.start_failed",
  "storage_proxy.request_failed",
  "storage_proxy.upstream_rejected",
] as const);

export type SafeLogEvent =
  | "auth.session_verification_failed"
  | "auth.user_sync_failed"
  | "admin.auth_failed"
  | "admin.api_failed"
  | "analytics.ga4_fetch_failed"
  | "ai_cost.log_failed"
  | "ai_cost.provider_cost_unavailable"
  | "automation.run_failed"
  | "backlink.discovery_failed"
  | "blog_studio.image_generation_failed"
  | "browser_login.failed"
  | "content.blog_post_update_failed"
  | "content.site_config_unavailable"
  | "database.connect_failed"
  | "database.exit_intent_insert_failed"
  | "database.lead_insert_failed"
  | "database.user_upsert_failed"
  | "ghl.webhook_failed"
  | "ghl.delivery_marker_failed"
  | "oauth.callback_failed"
  | "notification.request_failed"
  | "press_release.run_failed"
  | "seo.db_lookup_failed"
  | "seo.inventory_failed"
  | "server.readiness_failed"
  | "server.start_failed"
  | "storage_proxy.request_failed"
  | "storage_proxy.upstream_rejected";

const SAFE_ERROR_NAMES = new Set([
  "AbortError",
  "AggregateError",
  "AxiosError",
  "DataError",
  "Error",
  "RangeError",
  "SyntaxError",
  "TimeoutError",
  "TypeError",
] as const);

const SAFE_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
] as const);

type SafeErrorContext = {
  /** HTTP status is numeric and cannot contain response content. */
  upstreamStatus?: number;
};

function getSafeErrorName(error: unknown): string {
  if (!(error instanceof Error)) return "UnknownError";
  return SAFE_ERROR_NAMES.has(error.name as never) ? error.name : "Error";
}

function getSafeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && SAFE_ERROR_CODES.has(code as never)
    ? code
    : undefined;
}

/**
 * Emit a structured error record without ever inspecting error messages,
 * Axios config/request/response objects, database parameters, or response
 * bodies. Callers must use a compile-time allowlisted event.
 */
export function logSafeError(
  event: SafeLogEvent,
  error: unknown,
  context: SafeErrorContext = {},
): void {
  const safeEvent = SAFE_EVENTS.has(event as never) ? event : "unknown.failure";
  const errorCode = getSafeErrorCode(error);
  const upstreamStatus = Number.isInteger(context.upstreamStatus)
    && (context.upstreamStatus ?? 0) >= 100
    && (context.upstreamStatus ?? 0) <= 599
    ? context.upstreamStatus
    : undefined;

  console.error(JSON.stringify({
    level: "error",
    event: safeEvent,
    errorType: getSafeErrorName(error),
    ...(errorCode ? { errorCode } : {}),
    ...(upstreamStatus ? { upstreamStatus } : {}),
  }));
}
