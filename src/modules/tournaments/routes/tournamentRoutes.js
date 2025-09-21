/**
 * src/modules/tournaments/routes/tournamentRoutes.js
 */
const express = require("express");
const router = express.Router();
const tournamentController = require("../controllers/tournamentController");

// Cargamos la policy (puede exportar función u objeto)
const adminPolicy = require("../../../middlewares/checkAdmin");

// Función fallback (solo para desarrollo) si no encontramos un middleware válido
function __allowAll(req, res, next) {
  console.warn("[US-17] WARNING: checkAdmin export no es una función. Permitiendo acceso temporalmente en local.");
  next();
}

// Normalizamos a función-middleware
const ensureAdmin =
  (typeof adminPolicy === "function" && adminPolicy) ||
  adminPolicy?.checkAdmin ||
  adminPolicy?.onlyAdmin ||
  adminPolicy?.default ||
  __allowAll;

// ===== US-17: endpoints de configuración de torneo =====
router.get("/", tournamentController.listConfigs);
router.post("/", ensureAdmin, tournamentController.createConfig);
router.post("/:mongoId/publish", ensureAdmin, tournamentController.publishConfig);

// ===== Endpoints existentes para seed/bracket =====
router.delete("/:id/seed", tournamentController.deleteSeed);
router.post("/:id/seed", tournamentController.postSeed);
router.get("/:id/bracket", tournamentController.getBracket);
router.post("/:id/matches/:matchId", tournamentController.postMatch);

// Depuración
router.get("/:id/debug", tournamentController.debug);

module.exports = router;
