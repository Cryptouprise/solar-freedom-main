const BASE_URL = "https://breakyoursolarcontract.com";

export function parseSafeHttpUrl(value: unknown, allowRelative = false): URL | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const input = value.trim();
  if (!allowRelative && input.startsWith("/")) return null;
  try {
    const parsed = new URL(input, BASE_URL);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    if (!allowRelative && !/^https?:\/\//i.test(input)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasExpectedHostname(value: unknown, expectedHostname: string): boolean {
  const parsed = parseSafeHttpUrl(value);
  if (!parsed) return false;
  const hostname = parsed.hostname.toLowerCase();
  const expected = expectedHostname.toLowerCase();
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

export function hasExpectedCookieDomain(value: unknown, expectedHostname: string): boolean {
  if (typeof value !== "string") return false;
  const domain = value.trim().toLowerCase().replace(/^\.+/, "");
  const expected = expectedHostname.toLowerCase();
  return domain === expected || domain.endsWith(`.${expected}`);
}

export function safeMediaUrl(value: unknown): string | null {
  const parsed = parseSafeHttpUrl(value, true);
  if (!parsed) return null;
  return parsed.origin === BASE_URL && typeof value === "string" && value.trim().startsWith("/")
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : parsed.href;
}

export function youtubeEmbedUrl(value: unknown): string | null {
  const parsed = parseSafeHttpUrl(value);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  let id = "";
  if (host === "youtu.be" || host.endsWith(".youtu.be")) id = parsed.pathname.split("/").filter(Boolean)[0] || "";
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    id = parsed.pathname.startsWith("/embed/")
      ? parsed.pathname.split("/")[2] || ""
      : parsed.searchParams.get("v") || "";
  }
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
}

export function vimeoEmbedUrl(value: unknown): string | null {
  const parsed = parseSafeHttpUrl(value);
  if (!parsed || !hasExpectedHostname(parsed.href, "vimeo.com")) return null;
  const id = parsed.pathname.split("/").filter(Boolean).pop() || "";
  return /^\d{5,12}$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
}
