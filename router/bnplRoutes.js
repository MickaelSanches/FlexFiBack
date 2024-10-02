const express = require("express");
const router = express.Router();
const bnplController = require("../controllers/bnplController");

// Route pour la simulation BNPL
router.post("/simulate", bnplController.simulateBNPL);

// Créer une nouvelle vente BNPL
router.post("/sale", bnplController.createBNPLSale);

// Payer une mensualité BNPL
router.post("/payment", bnplController.payBNPLInstallment);

// Récupérer les détails d'une vente BNPL
router.get("/sale/:saleId", bnplController.getBNPLSaleDetails);

// Récupérer toutes les ventes BNPL pour un utilisateur
router.get("/user/:userPubKey/sales", bnplController.getUserBNPLSales);

// Télécharger l’échéancier
router.get(
  "/sale/:saleId/schedule/:type/pdf",
  bnplController.downloadSchedulePDF
);

module.exports = router;
