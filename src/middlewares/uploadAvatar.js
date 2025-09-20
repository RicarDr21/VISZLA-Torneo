const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(process.cwd(), "src", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  }
});

const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
function fileFilter(_req, file, cb) {
  if (!allowed.has(file.mimetype)) return cb(new Error("Formato no permitido. Usa PNG, JPG o WEBP."));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// Exporta directamente la FUNCIÓN middleware
const avatarUpload = upload.single("avatar");
module.exports = { avatarUpload };
