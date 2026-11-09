import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  BRAND_COLOR,
  DEFAULT_STROKE_WIDTH,
  FAVICON_STROKE_WIDTH,
  renderMarkElementsToString,
} from "../brand/marks.ts";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const OUT_DIR = path.join(REPO_ROOT, "brand", "icons");

function buildFaviconSvg(): string {
  const mark = renderMarkElementsToString(FAVICON_STROKE_WIDTH, BRAND_COLOR);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#141414" />
  ${mark}
</svg>
`;
}

function buildAppleTouchIconSvg(): string {
  const mark = renderMarkElementsToString(DEFAULT_STROKE_WIDTH, BRAND_COLOR);
  // Canvas 180x180, mark scaled to 64% of 180 = 115.2px.
  // Offset = (180 - 115.2) / 2 = 32.4px. Scale = 115.2 / 64 = 1.8.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180" fill="none">
  <rect width="180" height="180" fill="#141414" />
  <g transform="translate(32.4, 32.4) scale(1.8)">
    ${mark}
  </g>
</svg>
`;
}

function buildRoundedIconSvg(size: number): string {
  const mark = renderMarkElementsToString(DEFAULT_STROKE_WIDTH, BRAND_COLOR);
  const rx = size * 0.225; // 22.5% of size
  const markSize = size * 0.70; // 70% of tile
  const offset = (size - markSize) / 2;
  const scale = markSize / 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#141414" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    ${mark}
  </g>
</svg>
`;
}

function buildMaskableIconSvg(size: number = 512): string {
  const mark = renderMarkElementsToString(DEFAULT_STROKE_WIDTH, BRAND_COLOR);
  const markSize = size * 0.56; // 56% safe zone
  const offset = (size - markSize) / 2;
  const scale = markSize / 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none">
  <rect width="${size}" height="${size}" fill="#141414" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    ${mark}
  </g>
</svg>
`;
}

function buildWebManifest(): string {
  const manifest = {
    name: "Polymer",
    short_name: "Polymer",
    start_url: "/",
    display: "browser",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return JSON.stringify(manifest, null, 2) + "\n";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating icons into ${OUT_DIR}...`);

  // 1. favicon.svg
  const faviconSvg = buildFaviconSvg();
  fs.writeFileSync(path.join(OUT_DIR, "favicon.svg"), faviconSvg, "utf-8");

  // 2. favicon-32.png (32x32)
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(OUT_DIR, "favicon-32.png"));

  // 3. apple-touch-icon.png (180x180)
  const appleSvg = buildAppleTouchIconSvg();
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(OUT_DIR, "apple-touch-icon.png"));

  // 4. icon-192.png
  const icon192Svg = buildRoundedIconSvg(192);
  await sharp(Buffer.from(icon192Svg))
    .resize(192, 192)
    .png()
    .toFile(path.join(OUT_DIR, "icon-192.png"));

  // 5. icon-512.png
  const icon512Svg = buildRoundedIconSvg(512);
  await sharp(Buffer.from(icon512Svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(OUT_DIR, "icon-512.png"));

  // 6. icon-maskable-512.png
  const maskable512Svg = buildMaskableIconSvg(512);
  await sharp(Buffer.from(maskable512Svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(OUT_DIR, "icon-maskable-512.png"));

  // 7. manifest.webmanifest
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.webmanifest"),
    buildWebManifest(),
    "utf-8"
  );

  console.log(`✓ Completed icons generation in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
