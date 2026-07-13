import { isIP } from "node:net";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  png: { mimeType: "image/png", extension: "png" },
  gif: { mimeType: "image/gif", extension: "gif" },
  webp: { mimeType: "image/webp", extension: "webp" },
} as const;

export type ValidatedImage = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

export function isBlockedAddress(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const version = isIP(normalized);
  if (version === 4) return isPrivateIpv4(normalized);
  if (version !== 6) return true;

  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") ||
      normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
      normalized.startsWith("fea") || normalized.startsWith("feb") ||
      normalized.startsWith("ff") || normalized.startsWith("2001:db8:")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIpv4(mapped[1]) : false;
}

function inspectImage(buffer: Buffer): Omit<ValidatedImage, "buffer"> {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return IMAGE_TYPES.jpeg;
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return IMAGE_TYPES.png;
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return IMAGE_TYPES.gif;
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return IMAGE_TYPES.webp;
  throw new ImageValidationError("File signature is not a supported image (JPEG, PNG, GIF, or WebP)");
}

function normalizeDeclaredType(value?: string | null): string | undefined {
  return value?.split(";", 1)[0]?.trim().toLowerCase() || undefined;
}

export function decodeBase64Image(data: string, declaredType?: string): ValidatedImage {
  if (typeof data !== "string") throw new ImageValidationError("Image data must be a base64 string");
  const match = data.match(/^data:([^;,]+);base64,([\s\S]*)$/);
  const encoded = match ? match[2] : data;
  const typeFromUri = match?.[1];
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded.replace(/\s/g, ""))) {
    throw new ImageValidationError("Image data is not valid base64");
  }
  if (encoded.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4) {
    throw new ImageValidationError(`Image exceeds ${MAX_IMAGE_BYTES} bytes`);
  }
  const buffer = Buffer.from(encoded, "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new ImageValidationError(`Image exceeds ${MAX_IMAGE_BYTES} bytes`);
  const detected = inspectImage(buffer);
  const claimed = normalizeDeclaredType(typeFromUri ?? declaredType);
  if (claimed && claimed !== detected.mimeType) throw new ImageValidationError("Declared MIME type does not match image content");
  return { buffer, mimeType: detected.mimeType, extension: detected.extension };
}

export function safeImageStem(filename?: string): string {
  const raw = filename?.replace(/\.[^.]+$/, "") ?? `image-${Date.now()}`;
  const stem = raw.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return stem || `image-${Date.now()}`;
}
