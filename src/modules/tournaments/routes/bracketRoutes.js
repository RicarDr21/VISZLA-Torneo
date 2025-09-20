const express = require("express");
const ctrl = require("../controllers/BracketController");
const router = express.Router();

router.get("/bracket/:id", ctrl.getBracket);
router.get("/bracket/stream/:id", ctrl.streamBracket);

// QA: registrar resultado (para que el árbol avance)
router.post("/matches/:id/result", ctrl.reportResult);

module.exports = router;
