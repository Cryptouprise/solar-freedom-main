export type RuntimeConfig = {
  appId: string;
  cookieSecret: string;
  databaseUrl: string;
  oAuthServerUrl: string;
  ownerOpenId: string;
  isProduction: boolean;
  forgeApiUrl: string;
  forgeApiKey: string;
};

export function readRuntimeConfig(
  source: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  return {
    appId: source.VITE_APP_ID?.trim() ?? "",
    cookieSecret: source.JWT_SECRET ?? "",
    databaseUrl: source.DATABASE_URL ?? "",
    oAuthServerUrl: source.OAUTH_SERVER_URL?.trim() ?? "",
    ownerOpenId: source.OWNER_OPEN_ID?.trim() ?? "",
    isProduction: source.NODE_ENV === "production",
    forgeApiUrl: source.BUILT_IN_FORGE_API_URL?.trim() ?? "",
    forgeApiKey: source.BUILT_IN_FORGE_API_KEY ?? "",
  };
}

const WEAK_SECRET_MARKERS = [
  "change-me",
  "changeme",
  "default",
  "example",
  "password",
  "secret",
  "your-secret",
];

/**
 * JWT_SECRET protects every authenticated session. Require enough bytes for an
 * HS256 key and reject common placeholders and obviously repetitive values.
 */
export function isStrongSessionSecret(secret: string): boolean {
  const normalized = secret.trim();
  if (Buffer.byteLength(normalized, "utf8") < 32) return false;

  const lower = normalized.toLowerCase();
  if (WEAK_SECRET_MARKERS.some(marker => lower.includes(marker))) return false;

  const characters = normalized.split("");
  const uniqueCharacters = new Set(characters);
  if (uniqueCharacters.size < 12) return false;

  const frequencies = new Map<string, number>();
  for (const character of characters) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }
  const highestFrequency = Math.max(...Array.from(frequencies.values()));
  return highestFrequency / characters.length < 0.5;
}

function isSecureOAuthUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.username.length === 0
      && url.password.length === 0;
  } catch {
    return false;
  }
}

function isDatabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["mysql:", "mysql2:"].includes(url.protocol)
      && Boolean(url.hostname)
      && Boolean(url.pathname.replace(/^\//, ""));
  } catch {
    return false;
  }
}

/** Return configuration field names only; secret values are never included. */
export function getProductionConfigErrors(config: RuntimeConfig): string[] {
  if (!config.isProduction) return [];

  const errors: string[] = [];
  if (!config.appId) errors.push("VITE_APP_ID is required");
  if (!isStrongSessionSecret(config.cookieSecret)) {
    errors.push("JWT_SECRET must be a strong, random value of at least 32 bytes");
  }
  if (config.cookieSecret === config.appId) {
    errors.push("JWT_SECRET must not equal VITE_APP_ID");
  }
  if (!isSecureOAuthUrl(config.oAuthServerUrl)) {
    errors.push("OAUTH_SERVER_URL must be a credential-free HTTPS URL");
  }
  if (!isDatabaseUrl(config.databaseUrl)) {
    errors.push("DATABASE_URL must be a valid MySQL connection URL");
  }
  if (!config.ownerOpenId) {
    errors.push("OWNER_OPEN_ID is required");
  }
  return errors;
}

/** Fail before serving traffic when production session auth is unsafe. */
export function assertProductionRuntimeConfig(config: RuntimeConfig): void {
  const errors = getProductionConfigErrors(config);
  if (errors.length > 0) {
    throw new Error(`Invalid production runtime configuration: ${errors.join("; ")}`);
  }
}

export const ENV = readRuntimeConfig();
assertProductionRuntimeConfig(ENV);
