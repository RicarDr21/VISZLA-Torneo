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
