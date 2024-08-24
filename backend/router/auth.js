const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');
const nodemailer = require('nodemailer');
const bip39 = require('bip39');
const router = express.Router();

// Fonction pour générer une seed phrase
function generateSeedPhrase() {
    const mnemonic = bip39.generateMnemonic();
    return mnemonic;
}

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587, // Utilisez 587 pour TLS
    secure: false, // false pour utiliser TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Inscription - Étape 1 : Envoi du code de vérification par email
router.post('/send-verification-email', async (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres

    try {
        // Envoi de l'email de vérification
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Votre code de vérification',
            text: `Votre code de vérification est : ${verificationCode}. Ce code est valide pour 30 minutes.`
        });

        // Enregistrer le code dans la base de données
        await pool.query('INSERT INTO email_verification (email, code, expires_at) VALUES ($1, $2, $3)', [
            email,
            verificationCode,
            new Date(Date.now() + 30 * 60000) // 30 minutes de validité
        ]);

        res.json({ message: 'Code de vérification envoyé.' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de vérification.' });
    }
});

// Inscription - Étape 2 : Vérification du code de l'email
router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;

    try {
        const result = await pool.query('SELECT * FROM email_verification WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, code]);

        if (result.rows.length > 0) {
            res.json({ message: 'Email vérifié avec succès.' });
        } else {
            res.status(400).json({ error: 'Code de vérification invalide ou expiré.' });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        res.status(500).json({ error: 'Erreur lors de la vérification de l\'email.' });
    }
});

// Inscription - Étape 3 : Création du mot de passe après vérification de l'email
router.post('/set-password', async (req, res) => {
    const { email, password } = req.body;

    // Vérification de la complexité du mot de passe
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,128}$/;
    if (!passwordRegex.test(password)) {
        console.log('Le mot de passe ne répond pas aux critères.');
        return res.status(400).json({
            error: 'Le mot de passe doit contenir entre 8 et 128 caractères, inclure au moins un chiffre et une lettre majuscule.'
        });
    }

    try {
        // Vérifiez si l'utilisateur existe dans la table 'users'
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length === 0) {
            console.log('Utilisateur non trouvé dans "users". Ajout de l\'utilisateur dans la table "users".');
            const seedPhrase = generateSeedPhrase(); // Générer la seed phrase

            // Hacher le mot de passe et insérer l'utilisateur
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'INSERT INTO users (email, password, seed_phrase) VALUES ($1, $2, $3) RETURNING *',
                [email, hashedPassword, seedPhrase]
            );
            console.log('Nouvel utilisateur créé:', result.rows[0]);
            res.json({ message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.' });
        } else {
            console.log('Utilisateur déjà existant.');
            res.status(400).json({ error: 'Utilisateur déjà existant avec cet email.' });
        }

    } catch (error) {
        console.error('Erreur lors de la création du mot de passe:', error);
        res.status(500).json({ error: 'Erreur lors de la création du mot de passe.' });
    }
});

// Connexion - Étape 4
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifiez si l'utilisateur existe
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Vérifiez le mot de passe
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Créez un token JWT
        const payload = { user: { id: user.rows[0].id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
