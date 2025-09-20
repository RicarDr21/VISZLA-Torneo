/**
 * src/modules/tournaments/routes/tournamentRoutes.js
 */
const express = require("express");
const router = express.Router();
const tournamentController = require("../controllers/tournamentController");

router.delete("/:id/seed", tournamentController.deleteSeed);
router.post("/:id/seed", tournamentController.postSeed);
router.get("/:id/bracket", tournamentController.getBracket);
router.post("/:id/matches/:matchId", tournamentController.postMatch);

// 👇 Ruta de depuración
router.get("/:id/debug", tournamentController.debug);

module.exports = router;
