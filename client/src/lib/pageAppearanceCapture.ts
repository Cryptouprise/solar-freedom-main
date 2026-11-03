import type { PageVisualReviewInput } from "../../../server/pageVisualReview";

export async function capturePageAppearance(): Promise<PageVisualReviewInput> {
  const path = window.location.pathname.replace(/\/$/, "");
  if (!/^\/(?:blog|cancel-solar-contract)\/[a-z0-9-]+$/.test(path)) throw new Error("Open an exact public article or city page first.");
  const width = window.innerWidth, height = window.innerHeight;
  if (width < 320 || width > 1920 || height < 480 || height > 1600) throw new Error("Use a browser view between 320–1920 px wide and 480–1600 px tall.");
  await document.fonts.ready;
  const root = document.querySelector<HTMLElement>("[data-priority-city-guide],main,article") || document.body;
  const visible = (element: Element) => { const box = element.getBoundingClientRect(), style = getComputedStyle(element); return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none"; };
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img")).filter(visible);
  const cleanTarget = (anchor: HTMLAnchorElement) => { try { const url = new URL(anchor.href); return url.protocol === "http:" || url.protocol === "https:" ? `${url.origin}${url.pathname}${url.hash}`.slice(0, 500) : anchor.getAttribute("href")?.slice(0, 500) || ""; } catch { return ""; } };
  const evidence: PageVisualReviewInput["evidence"] = {
    title: document.title.slice(0, 300),
    headings: Array.from(root.querySelectorAll("h1,h2,h3")).filter(visible).slice(0, 60).map(el => (el.textContent || "").trim().slice(0, 250)),
    paragraphWords: Array.from(root.querySelectorAll("p")).filter(visible).slice(0, 300).map(el => (el.textContent || "").trim().split(/\s+/).filter(Boolean).length),
    imageCount: images.length, brokenImages: images.filter(img => img.complete && img.naturalWidth === 0).length,
    missingAlt: images.filter(img => !img.hasAttribute("alt")).length,
    horizontalOverflow: document.documentElement.scrollWidth > width + 4,
    ctas: Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(a => visible(a) && /review|qualify|book|call|chat|appointment/i.test(a.textContent || "")).slice(0, 40).map(a => ({ text: (a.textContent || "").trim().slice(0, 200), target: cleanTarget(a), top: Math.round(a.getBoundingClientRect().top + window.scrollY), visible: a.getBoundingClientRect().top < height && a.getBoundingClientRect().bottom > 0 })),
    limitations: ["Owner's browser DOM capture, not a browser-native screenshot. Cross-origin styling/media may differ.", "All inputs, textareas, selects, iframes, third-party chat shadow widgets and the owner-review control are excluded. No entered form data is sent. Use native browser screenshots to review third-party overlays.", "One viewport width is checked; other device widths are not automatically reviewed."],
  };
  const { toJpeg } = await import("html-to-image");
  const fullHeight = Math.min(document.documentElement.scrollHeight, 12000);
  if (document.documentElement.scrollHeight > fullHeight) evidence.limitations.push("Capture is limited to the first 12,000 pixels; the true page bottom is not captured.");
  // Browsers can display an image that a DOM serializer cannot fetch (e.g. a
  // CDN with image-only CORS). Keep its layout box, but never claim its subject
  // was reviewed. Native browser screenshots via the API remain the full-vision route.
  const placeholder = document.createElement("canvas"); placeholder.width = 2; placeholder.height = 2;
  const placeholderContext = placeholder.getContext("2d"); if (!placeholderContext) throw new Error("Image capture canvas unavailable");
  placeholderContext.fillStyle = "#27272a"; placeholderContext.fillRect(0, 0, 2, 2);
  evidence.limitations.push("Images blocked from DOM embedding can become neutral placeholders; image subject, accuracy and visual quality are not verified by this DOM capture. Native screenshots are recommended.");
  const data = await toJpeg(document.body, {
    width, height: fullHeight, pixelRatio: .75, quality: .78,
    imagePlaceholder: placeholder.toDataURL("image/png"),
    filter: node => {
      if (node instanceof HTMLImageElement && (!node.getAttribute("src") || node.getBoundingClientRect().width === 0)) return false;
      return !(node instanceof Element && (node.matches("input,textarea,select,iframe,script,chat-widget,[data-owner-visual-review],[data-private]") || node.closest("[data-private]")));
    },
    style: { margin: "0", width: `${width}px`, transform: "none" },
  });
  const image = new Image(); image.src = data; await image.decode();
  const scale = image.width / width;
  const offsets = [0, Math.max(0, Math.round((fullHeight - height) / 2)), Math.max(0, fullHeight - height)];
  const positions = ["top", "middle", "bottom"] as const;
  const captures: PageVisualReviewInput["captures"] = offsets.map((offset, index) => {
    const canvas = document.createElement("canvas"); canvas.width = Math.round(width * scale); canvas.height = Math.round(Math.min(height, fullHeight) * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Browser image canvas unavailable");
    context.drawImage(image, 0, Math.round(offset * scale), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    return { position: positions[index], image: canvas.toDataURL("image/jpeg", .78) };
  });
  return { path, capturedAt: new Date().toISOString(), captureMethod: "dom_capture", viewport: { width, height }, captures, evidence };
}
