import { describe, expect, it } from "vitest";
import { decodeBase64Image, isBlockedAddress, safeImageStem } from "./imageUpload";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("image upload validation", () => {
  it("detects image type from bytes instead of trusting the client", () => {
    const image = decodeBase64Image(PNG_SIGNATURE.toString("base64"), "image/png");
    expect(image.mimeType).toBe("image/png");
    expect(image.extension).toBe("png");
  });

  it("rejects MIME spoofing and non-image payloads", () => {
    expect(() => decodeBase64Image(PNG_SIGNATURE.toString("base64"), "image/jpeg")).toThrow(/MIME type/i);
    expect(() => decodeBase64Image(Buffer.from("<script>bad</script>").toString("base64"), "image/png")).toThrow(/signature/i);
  });

  it.each(["127.0.0.1", "10.0.0.2", "169.254.169.254", "192.168.1.5", "::1", "fd00::1", "2001:db8::1"])(
    "blocks private or reserved address %s",
    (address) => expect(isBlockedAddress(address)).toBe(true)
  );

  it("normalizes untrusted filenames", () => {
    expect(safeImageStem("../../<script>hero image.png")).toBe("script-hero-image");
  });
});

