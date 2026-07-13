export const COOKIE_NAME = "app_session_id";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
/** @deprecated Use SESSION_DURATION_MS. Kept temporarily for client imports. */
export const ONE_YEAR_MS = SESSION_DURATION_MS;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

export const SITE_CONFIG_DEFAULTS = {
  phone_number: "(904) 921-4971",
  phone_number_e164: "+19049214971",
  assistant_name: "Grace Silver",
  assistant_title: "AI Executive Assistant",
} as const;
