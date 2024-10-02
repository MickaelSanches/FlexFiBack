const express = require("express");
const router = express.Router();
const bnplController = require("../controllers/bnplController");

// Route pour la simulation BNPL
router.post("/bnpl/simulate", bnplController.simulateBNPL);

// Créer une nouvelle vente BNPL
router.post("/bnpl/sale", bnplController.createBNPLSale);

// Payer une mensualité BNPL
router.post("/bnpl/payment", bnplController.payBNPLInstallment);

// Récupérer les détails d'une vente BNPL
router.get("/bnpl/sale/:saleId", bnplController.getBNPLSaleDetails);

// Récupérer toutes les ventes BNPL pour un utilisateur
router.get("/bnpl/user/:userPubKey/sales", bnplController.getUserBNPLSales);

// Télécharger l’échéancier
router.get(
  "/bnpl/sale/:saleId/schedule/:type/pdf",
  bnplController.downloadSchedulePDF
);

module.exports = router;
