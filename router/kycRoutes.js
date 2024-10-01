const express = require('express');
const kycController = require('../controllers/kycController');

const router = express.Router();

// Démarrer le processus KYC pour un utilisateur
router.post('/start', kycController.initiateKYC);

// Vérifier le statut KYC d'un utilisateur
router.get('/status/:userId', kycController.checkKYCStatus);

// Mettre à jour le statut KYC (manuellement ou automatiquement via un callback)
router.post('/update', kycController.updateKYCStatus);

module.exports = router;
