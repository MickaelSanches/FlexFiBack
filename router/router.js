const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const proController = require('../controllers/proController');
const solanaService = require('../services/solanaServiceTEST');

// Inscription - Étape 1 : Envoi du code de vérification par email
router.post('/send-verification-email', authController.sendVerificationEmail);

// Inscription - Étape 2 : Vérification du code de l'email
router.post('/verify-email', authController.verifyEmail);

// Inscription - Étape 3 : Création du mot de passe après vérification de l'email
router.post('/set-password', authController.setPassword);

// Route pour envoyer le mail de confirmation
router.post('/send-confirmation-email', authController.sendConfirmationEmail);

// Route pour enregistrer l'utilisateur en base de données
router.post('/register', authController.register);

// Connexion - Étape 4
router.post('/login', authController.login);

// Route pour valider les informations professionnelles via l'API INSEE
router.post('/validate-business-info', proController.validateBusinessInfo);

// Route pour générer la seed phrase après validation
router.post('/generate-seed', proController.generateSeed);

// Route pour déposer des SOL dans le programme
router.post('/deposit-sol', async (req, res) => {
    const { senderPrivateKey, amount } = req.body;

    try {
        // Appel à la méthode depositSol dans SolanaService
        await solanaService.depositSol(senderPrivateKey, amount);
        res.status(200).send({ message: `Dépôt de ${amount} SOL effectué avec succès.` });
    } catch (error) {
        console.error('Erreur lors du dépôt de SOL:', error);
        res.status(500).send({ error: 'Échec du dépôt de SOL' });
    }
});

// Route pour envoyer un paiement via le smart contract
router.post('/direct-payment', async (req, res) => {
    const { senderPrivateKey, recipientPublicKey, amount, asset } = req.body;
  
    try {
      await solanaService.directPayment(senderPrivateKey, recipientPublicKey, amount, asset);
      res.json({ message: `Transaction réussie : ${amount} ${asset} envoyé à ${recipientPublicKey}` });
    } catch (error) {
      console.error("Erreur lors de l'envoi du paiement :", error.message);
      res.status(400).json({ error: error.message });
    }
  });

// Route pour récupérer le solde du wallet
router.get('/get-wallet-balance/:publicKey', async (req, res) => {
    const { publicKey } = req.params;
    const { asset } = req.query;
  
    try {
      const balance = await solanaService.getWalletBalance(publicKey, asset);
      res.json({ balance });
    } catch (error) {
      console.error("Erreur lors de la récupération du solde :", error.message);
      res.status(400).json({ error: error.message });
    }
  });

module.exports = router;
