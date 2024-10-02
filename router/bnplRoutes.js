const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const bnplController = require("../controllers/bnplController");

// Route pour la simulation BNPL
router.post('/bnpl/simulate', bnplController.simulateBNPL);

// Créer une nouvelle vente BNPL
router.post("/bnpl/sale", bnplController.createBNPLSale);

// Payer une mensualité BNPL
router.post("/bnpl/payment", bnplController.payBNPLInstallment);

// Récupérer les détails d'une vente BNPL
router.get("/bnpl/sale/:saleId", bnplController.getBNPLSaleDetails);

// Récupérer toutes les ventes BNPL pour un utilisateur
router.get("/bnpl/user/:userPubKey/sales", bnplController.getUserBNPLSales);

// Télécharger l’échéancier
router.get("/bnpl/sale/:saleId/schedule/:type/pdf", bnplController.downloadSchedulePDF);
=======
const { simulateBNPL } = require("../controllers/bnplController");

// Route pour la simulation BNPL
router.post("/simulate", simulateBNPL);
>>>>>>> 575b9505cec0a26973dc91dba3bc612214dcd74b

module.exports = router;
