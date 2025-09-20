const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const validateTeamName = require("../../../middlewares/validateTeamName");
const Team = require("../models/Team");

const router = express.Router();

// --- Configuración de uploads EN LA RUTA ---
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

// --- RUTAS ---
// GET /api/teams -> lista
router.get("/teams", async (_req, res) => {
  const teams = await Team.find().sort({ createdAt: -1 });
  res.json(teams);
});

// POST /api/teams -> crea (valida nombre ANTES, luego procesa avatar)
router.post(
  "/teams",
  (req, res, next) => validateTeamName(req, res, next),   // nos aseguramos que sea función
  (req, res, next) => upload.single("avatar")(req, res, next), // idem
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Debe subir un avatar." });
      const { name } = req.body;

      // Duplicados (case-insensitive)
      const exists = await Team.findOne({ name: new RegExp(`^${name}$`, "i") });
      if (exists) return res.status(409).json({ error: "Ese nombre ya está en uso." });

      const team = await Team.create({ name, avatarUrl: "/uploads/" + req.file.filename });
      res.status(201).json({ message: "Equipo creado", team });
    } catch (err) {
      console.error("Error en POST /teams:", err);
      res.status(500).json({ error: "Error del servidor", details: err.message });
    }
  }
);

module.exports = router;
