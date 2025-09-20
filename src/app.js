const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Team = require("./modules/teams/models/Team");
const validateTeamName = require("./middlewares/validateTeamName");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// === UPLOADS ===
const UPLOAD_DIR = path.join(
  process.cwd(),
  "src",
  "public",
  process.env.NODE_ENV === "test" ? "uploads_test" : "uploads"
);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

// Importante: sin fileFilter para no cortar el stream (evita ECONNRESET)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);

// === RUTAS ===
app.get("/api/teams", async (_req, res, next) => {
  try {
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    res.json(teams);
  } catch (err) { next(err); }
});

app.post(
  "/api/teams",
  upload.single("avatar"),
  validateTeamName,
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Debe subir un avatar." });

      // Validación de tipo AQUÍ (ya subido): si no es válido, borrar y 400
      if (!allowed.has(req.file.mimetype)) {
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: "Formato no permitido. Usa PNG, JPG o WEBP." });
      }

      const { name } = req.body;

      // Duplicado (case-insensitive)
      const exists = await Team.findOne({ name: new RegExp(`^${name}$`, "i") });
      if (exists) {
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        return res.status(409).json({ error: "Ese nombre ya está en uso." });
      }

      const team = await Team.create({
        name,
        avatarUrl: "/uploads/" + req.file.filename,
      });

      res.status(201).json({ message: "Equipo creado", team });
    } catch (err) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      next(err);
    }
  }
);

// === Manejador global de errores ===
app.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "El avatar supera el límite de 2MB." });
  }
  console.error("SERVER ERROR:", err);
  return res.status(500).json({ error: "Error del servidor", details: err.message });
});

process.on("unhandledRejection", (r) => console.error("UNHANDLED REJECTION:", r));
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION:", e));

module.exports = app;
