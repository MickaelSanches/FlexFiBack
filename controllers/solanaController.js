// solanaController.js
const solanaService = require("../services/solanaService");

class SolanaController {
  async depositSol(req, res) {
    const { senderPrivateKey, amount } = req.body;
    try {
      const result = await solanaService.depositSol(senderPrivateKey, amount);
      res.status(200).send({
        message: `Dépôt de ${amount} SOL effectué avec succès.`,
        result,
      });
    } catch (error) {
      console.error("Erreur lors du dépôt de SOL:", error);
      res.status(500).send({ error: "Échec du dépôt de SOL" });
    }
  }

  async directPayment(req, res) {
    const { senderPrivateKey, recipientPublicKey, amount, asset } = req.body;
    try {
      const result = await solanaService.directPayment(
        senderPrivateKey,
        recipientPublicKey,
        amount,
        asset
      );
      res.json({
        message: `Transaction réussie : ${amount} ${asset} envoyé à ${recipientPublicKey}`,
        result,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du paiement :", error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async getWalletBalance(req, res) {
    const { publicKey } = req.params;
    const { asset } = req.query;
    try {
      const balance = await solanaService.getWalletBalance(publicKey, asset);
      res.json({ balance });
    } catch (error) {
      console.error("Erreur lors de la récupération du solde :", error.message);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SolanaController();
