const fs = require("fs");
const path = require("path");

// Define folders to include
const basePath = path.join(__dirname, "../../images/outfits/fyp");
const outputPath = path.join(__dirname, "../../../data/images.json");

const folders = ["friends", "trending"]; // 🧩 Add more later if needed

// Helper to get image files in a folder
function getImageFiles(folderPath) {
  const exts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((f) => f.isFile() && exts.includes(path.extname(f.name).toLowerCase()))
    .map((f) => f.name);
}

function generateImageData() {
  const allImages = [];

  folders.forEach((page) => {
    const folderPath = path.join(basePath, page);

    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️ Folder not found: ${folderPath}`);
      return;
    }

    const files = getImageFiles(folderPath);

    files.forEach((file) => {
      allImages.push({
        url: `/assets/images/outfits/fyp/${page}/${file}`,
        page: page,
      });
    });
  });

  return allImages;
}

function saveImageData() {
  const data = generateImageData();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${data.length} image entries to ${outputPath}`);
}

saveImageData();