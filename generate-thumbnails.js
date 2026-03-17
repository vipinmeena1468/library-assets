// generate-thumbnails.js
// Scans all category folders and generates WebP thumbnails.
// Skips images that already have a thumbnail — safe to re-run.

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const THUMB_DIR = path.join(ROOT_DIR, "thumbnails");
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 80;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SKIP_DIRS = new Set([".git", ".github", "node_modules", "thumbnails"]);

function isImageFile(fileName) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

async function generateThumbnails() {
  const categories = fs
    .readdirSync(ROOT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name))
    .map((e) => e.name);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const category of categories) {
    const categoryPath = path.join(ROOT_DIR, category);
    const thumbCategoryDir = path.join(THUMB_DIR, category);
    fs.mkdirSync(thumbCategoryDir, { recursive: true });

    const files = fs.readdirSync(categoryPath).filter(isImageFile);

    for (const file of files) {
      const inputPath = path.join(categoryPath, file);
      const thumbName = path.parse(file).name + ".webp";
      const outputPath = path.join(thumbCategoryDir, thumbName);

      if (fs.existsSync(outputPath)) {
        skipped++;
        continue;
      }

      try {
        await sharp(inputPath)
          .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: THUMB_QUALITY })
          .toFile(outputPath);

        console.log(`✓ thumbnails/${category}/${thumbName}`);
        generated++;
      } catch (err) {
        console.error(`✗ Failed: ${category}/${file} — ${err.message}`);
        failed++;
      }
    }
  }

  console.log(
    `\nDone: ${generated} generated, ${skipped} already existed, ${failed} failed.`
  );

  if (failed > 0) process.exit(1);
}

generateThumbnails().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
