const path = require("path");
const express = require("express");
const app = express();

// Middlewares básicos
app.use(express.json());

// Static del front
app.use(express.static(path.join(__dirname, "public")));

// Health
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// Rutas de torneos
const tournamentRoutes = require("./modules/tournaments/routes/tournamentRoutes");
app.use("/api/tournaments", tournamentRoutes);

// (Opcional) otras rutas/API aquí...

module.exports = app;


/** ===== US-17 admin page (protegida) v2 ===== */
const __checkAdminUS17 = require("./middlewares/checkAdmin");
// Usa el 'path' ya existente si está definido; si no, lo require con alias.
const __pathUS17 = (typeof path !== "undefined" && path) || require("path");

app.get("/admin", __checkAdminUS17, (req, res) => {
  res.sendFile(__pathUS17.join(__dirname, "private/admin/index.html"));
});
/** ===== end US-17 v2 ===== */
