import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const BRAND_DIR = path.join(REPO_ROOT, "brand", "icons");
const DIST_DIR = path.join(REPO_ROOT, "frontend", "dist");

function main() {
  if (!fs.existsSync(BRAND_DIR)) {
    console.error(`Error: Brand directory does not exist: ${BRAND_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 1. Copy brand files to dist root unhashed
  const files = fs.readdirSync(BRAND_DIR);
  for (const file of files) {
    const src = path.join(BRAND_DIR, file);
    const dest = path.join(DIST_DIR, file);
    fs.copyFileSync(src, dest);
  }
  console.log(`✓ Copied brand/icons/ files to frontend/dist/`);

  // 2. Inject head tags into dist/index.html
  const distHtmlPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(distHtmlPath)) {
    console.error(`Error: dist/index.html not found at ${distHtmlPath}`);
    process.exit(1);
  }

  let html = fs.readFileSync(distHtmlPath, "utf-8");

  const headTags = [
    `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/manifest.webmanifest" />`,
    `<meta name="theme-color" content="#000000" />`,
  ].join("\n    ");

  // Only inject if not already present
  if (!html.includes('href="/favicon.svg"')) {
    if (html.includes("</head>")) {
      html = html.replace("</head>", `    ${headTags}\n  </head>`);
    } else if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>\n    ${headTags}`);
    } else {
      html = `<head>\n    ${headTags}\n  </head>\n` + html;
    }
    fs.writeFileSync(distHtmlPath, html, "utf-8");
    console.log(`✓ Injected brand head tags into frontend/dist/index.html`);
  }

  // 3. Validation: Verify all referenced head assets exist in frontend/dist/
  const updatedHtml = fs.readFileSync(distHtmlPath, "utf-8");

  // Match icon and manifest link tags
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  const referencedHrefs: string[] = [];

  while ((match = linkRegex.exec(updatedHtml)) !== null) {
    const tag = match[0];
    const href = match[1];
    if (
      href &&
      (tag.includes('rel="icon"') ||
        tag.includes("rel='icon'") ||
        tag.includes('rel="apple-touch-icon"') ||
        tag.includes("rel='apple-touch-icon'") ||
        tag.includes('rel="manifest"') ||
        tag.includes("rel='manifest'"))
    ) {
      referencedHrefs.push(href);
    }
  }

  for (const href of referencedHrefs) {
    const filename = href.startsWith("/") ? href.slice(1) : href;
    const targetPath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(targetPath)) {
      console.error(
        `Build Error: Referenced asset in dist/index.html does not exist: "${targetPath}" (href: "${href}")`
      );
      process.exit(1);
    }
  }

  // 4. Validation: Verify all manifest icons exist in frontend/dist/
  const manifestPath = path.join(DIST_DIR, "manifest.webmanifest");
  if (!fs.existsSync(manifestPath)) {
    console.error(
      `Build Error: Manifest file does not exist at "${manifestPath}"`
    );
    process.exit(1);
  }

  let manifestData: any;
  try {
    manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch (err) {
    console.error(`Build Error: Failed to parse manifest.webmanifest:`, err);
    process.exit(1);
  }

  if (Array.isArray(manifestData.icons)) {
    for (const icon of manifestData.icons) {
      if (typeof icon.src === "string") {
        const filename = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src;
        const targetPath = path.join(DIST_DIR, filename);
        if (!fs.existsSync(targetPath)) {
          console.error(
            `Build Error: Icon referenced in manifest.webmanifest does not exist: "${targetPath}" (src: "${icon.src}")`
          );
          process.exit(1);
        }
      }
    }
  }

  console.log(`✓ All brand assets verified in frontend/dist/`);
}

main();
