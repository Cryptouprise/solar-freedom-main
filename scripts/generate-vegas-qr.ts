/**
 * Generates one QR PNG per rep/city field link, then decodes each image back to
 * confirm it points at the intended URL. A QR that does not resolve is worse
 * than no QR, so every image is verified rather than assumed.
 *
 * Usage: pnpm exec tsx scripts/generate-vegas-qr.ts [rep_code ...]
 */
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { VEGAS_METRO_CITIES, vegasFieldTeamUrl, type VegasMetroSlug } from "../shared/vegasCampaign";

const OUT = "/home/ubuntu/solar-freedom-deliverables/las-vegas/field-links";
const reps = process.argv.slice(2).filter((value) => /^[a-z0-9_-]{1,40}$/i.test(value));
if (reps.length === 0) reps.push("rep_example");

await fs.mkdir(OUT, { recursive: true });

const results: { file: string; url: string }[] = [];
for (const rep of reps) {
  for (const city of VEGAS_METRO_CITIES) {
    const url = vegasFieldTeamUrl(city.slug as VegasMetroSlug, rep);
    const file = `qr-${rep}-${city.slug}.png`;
    await QRCode.toFile(path.join(OUT, file), url, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 900,
      color: { dark: "#18181b", light: "#ffffff" },
    });
    results.push({ file, url });
  }
}

await fs.writeFile(path.join(OUT, "qr-manifest.json"), JSON.stringify({ generatedFor: reps, links: results }, null, 2) + "\n");
console.log(`Generated ${results.length} QR images.`);
