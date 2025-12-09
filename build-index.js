// build-index.js
// Scans first level folders and builds index.json with image metadata

const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const OUTPUT_FILE = path.join(ROOT_DIR, "index.json");

// Allowed image file extensions
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function getCategories(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== ".github"
    )
    .map((dir) => dir.name);
}

function getImagesForCategory(rootDir, categoryName) {
  const categoryPath = path.join(rootDir, categoryName);
  const entries = fs.readdirSync(categoryPath, { withFileTypes: true });

  const images = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fileName = entry.name;
    if (!isImageFile(fileName)) continue;

    const relativePath = path.join(categoryName, fileName).replace(/\\/g, "/");

    images.push({
      path: relativePath,
      fileName,
    });
  }

  return images;
}

function buildIndex() {
  const categories = getCategories(ROOT_DIR);

  const result = {
    generatedAt: new Date().toISOString(),
    categories: [],
  };

  for (const categoryName of categories) {
    const images = getImagesForCategory(ROOT_DIR, categoryName);

    if (images.length === 0) continue;

    result.categories.push({
      id: categoryName,
      name: categoryName,
      images,
    });
  }

  return result;
}

function main() {
  const index = buildIndex();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), "utf8");

  const totalImages = index.categories.reduce(
    (sum, cat) => sum + cat.images.length,
    0
  );

  console.log(
    `index.json written with ${index.categories.length} categories and ${totalImages} images`
  );
  console.log("File:", OUTPUT_FILE);
}

main();
