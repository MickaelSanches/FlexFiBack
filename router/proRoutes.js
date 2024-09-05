const express = require("express");
const router = express.Router();
const proController = require("../controllers/proController");

// Route pour valider les informations professionnelles via l'API INSEE
router.post("/validate-business-info", proController.validateBusinessInfo);

// Route pour générer la seed phrase après validation
router.post("/generate-seed", proController.generateSeed);

module.exports = router;
