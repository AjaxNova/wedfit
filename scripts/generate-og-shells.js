import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const mapPath = path.join(rootDir, "scripts", "cloudinary-map.json");
const labelsPath = path.join(rootDir, "scripts", "og-labels.json");

function extractPublicId(url) {
  // Matches path after /upload/ (including optional transformations and versions) and strips file extension
  const match = url.match(/\/upload\/(?:[a-zA-Z0-9_,:]+\/)?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (!match) return null;
  return match[1];
}

function optimizeCloudinaryUrl(url) {
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }
  if (url.includes("/video/upload/")) {
    return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
  }
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

function generateHtml(label, imageUrl, leafName) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${label} — Wedfit</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${label} — Wedfit" />
  <meta property="og:description" content="Wedding attire rental in Kozhikode. Enquire on WhatsApp." />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1600" />
  <meta property="og:url" content="https://ajaxnova.github.io/wedfit/look/${leafName}/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=https://ajaxnova.github.io/wedfit/" />
</head>
<body>
  <p>Redirecting to <a href="https://ajaxnova.github.io/wedfit/">Wedfit</a>…</p>
</body>
</html>
`;
}

function run() {
  if (!fs.existsSync(distDir)) {
    console.error("dist/ directory not found. Please run vite build first.");
    process.exit(1);
  }

  if (!fs.existsSync(mapPath)) {
    console.error(`Cloudinary map not found at ${mapPath}`);
    process.exit(1);
  }

  // Clean dist/look before generating to avoid stale directories
  const lookDir = path.join(distDir, "look");
  if (fs.existsSync(lookDir)) {
    fs.rmSync(lookDir, { recursive: true, force: true });
  }

  const cloudinaryMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  let ogLabels = {};
  if (fs.existsSync(labelsPath)) {
    ogLabels = JSON.parse(fs.readFileSync(labelsPath, "utf-8"));
  }

  const images = cloudinaryMap.images || {};
  const ALLOWED_PREFIXES = ["wedfit/solo/", "wedfit/family/", "wedfit/groomsmen/"];
  let generated = 0;
  let skipped = 0;

  for (const [, cloudinaryUrl] of Object.entries(images)) {
    const fullPublicId = extractPublicId(cloudinaryUrl);
    if (!fullPublicId) continue;

    const isOutfitLook = ALLOWED_PREFIXES.some((prefix) => fullPublicId.startsWith(prefix));
    if (!isOutfitLook) {
      skipped++;
      continue;
    }

    const leafName = path.basename(fullPublicId);
    const labelEntry = ogLabels[fullPublicId];
    let label = "Wedfit Look";

    if (labelEntry && labelEntry.label) {
      label = labelEntry.label;
    }

    const optimizedImageUrl = optimizeCloudinaryUrl(cloudinaryUrl);
    const targetDir = path.join(distDir, "look", leafName);
    fs.mkdirSync(targetDir, { recursive: true });

    const htmlContent = generateHtml(label, optimizedImageUrl, leafName);
    fs.writeFileSync(path.join(targetDir, "index.html"), htmlContent, "utf-8");
    generated++;
  }

  console.log(`Generated ${generated} shells, skipped ${skipped} (non-look assets).`);
}

run();
