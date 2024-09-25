const solanaWeb3 = require('@solana/web3.js');
const solanaService = require("../services/solanaService");

class SolanaController {
  
  async createFlexFiWallet(req, res) {
    try {
      const result = await solanaService.createFlexFiWallet();
      res.status(200).send({
        message: "Wallet FlexFi créé avec succès",
        publicKey: result.publicKey,
      });
    } catch (error) {
      console.error("Erreur lors de la création du wallet FlexFi:", error);
      res.status(500).send({ error: "Échec de la création du wallet FlexFi" });
    }
  }

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
    const { senderPrivateKey, senderPublicKey, recipientPublicKey, amount, asset } = req.body;

    try {
      // Enregistrer le wallet sur la blockchain lors de la première transaction
      await solanaService.registerWalletOnChain(senderPublicKey, senderPrivateKey);

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

  // Récupérer l'historique des transactions pour une adresse donnée
  async getTransactionHistory(req, res) {
    const { publicKey } = req.params;
    
    try {
      // Assurez-vous que publicKey est une chaîne de caractères
      const publicKeyString = String(publicKey);

      console.log(`Récupération des signatures pour l'adresse : ${publicKeyString}`);

      const transactions = await solanaService.getTransactionHistory(publicKeyString);
      res.json({ transactions });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des transactions :", error);
      res.status(500).json({ error: "Impossible de récupérer l'historique des transactions" });
    }
  }
}

module.exports = new SolanaController();
