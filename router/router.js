const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const proController = require('../controllers/proController');

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

module.exports = router;
