const express = require("express");
const router = express.Router();
const solanaController = require("../controllers/solanaController");

// Route pour déposer des SOL dans le programme
router.post("/deposit-sol", solanaController.depositSol);

// Route pour envoyer un paiement via le smart contract
router.post("/direct-payment", solanaController.directPayment);

// Route pour récupérer le solde du wallet
router.get("/get-wallet-balance/:publicKey", solanaController.getWalletBalance);

module.exports = router;
