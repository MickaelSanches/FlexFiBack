const express = require("express");
const router = express.Router();
const { simulateBNPL } = require("../controllers/bnplController");

// Route pour la simulation BNPL
router.post("/simulate", simulateBNPL);

module.exports = router;
