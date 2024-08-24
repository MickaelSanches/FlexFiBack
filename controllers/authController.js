const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');
const nodemailer = require('nodemailer');
const bip39 = require('bip39');

// Fonction pour générer une seed phrase
function generateSeedPhrase() {
  const mnemonic = bip39.generateMnemonic();
  return mnemonic;
}


// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",
  port: 587, // Utilisez 587 pour TLS
  secure: false, // false pour utiliser TLS
  auth: {
    user: "contact@innovpower.io",
    pass: "LesYeuxVersl'Avenir4870."
  }
});

exports.sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Votre code de vérification',
      text: `Votre code de vérification est : ${verificationCode}. Ce code est valide pour 30 minutes.`,
    });

    // Enregistrement du code dans la base de données
    await pool.query('INSERT INTO email_verification (email, code, expires_at) VALUES ($1, $2, $3)', [
      email,
      verificationCode,
      new Date(Date.now() + 30 * 60000), // 30 minutes de validité
    ]);

    res.json({ message: 'Code de vérification envoyé.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de vérification.' });
  }
};



exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  console.log('Email:', email);
  console.log('Code reçu:', code);

  try {
    const result = await pool.query('SELECT * FROM public.email_verification WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, code]);

    if (result.rows.length > 0) {
      console.log('Vérification réussie:', result.rows[0]);
      res.json({ message: 'Email vérifié avec succès.' });
    } else {
      console.log('Code invalide ou expiré pour:', email);
      res.status(400).json({ error: 'Code de vérification invalide ou expiré.' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email.' });
  }
};

exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,128}$/;
  if (!passwordRegex.test(password)) {
    console.log('Le mot de passe ne répond pas aux critères.');
    return res.status(400).json({
      error: 'Le mot de passe doit contenir entre 8 et 128 caractères, inclure au moins un chiffre et une lettre majuscule.'
    });
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length === 0) {
      console.log('Utilisateur non trouvé dans "users". Ajout de l\'utilisateur dans la table "users".');
      const seedPhrase = generateSeedPhrase();

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
};

exports.sendConfirmationEmail = async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirmation de votre inscription',
      text: `Merci de vous être inscrit. Voici votre code de confirmation : ${verificationCode}.`
    });

    res.json({ message: 'Email de confirmation envoyé.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation.' });
  }
};

exports.register = async (req, res) => {
  const { email, password } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,128}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Le mot de passe doit contenir entre 8 et 128 caractères, inclure au moins un chiffre et une lettre majuscule.'
    });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const seedPhrase = generateSeedPhrase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (email, password, seed_phrase) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, seedPhrase]
    );

    res.json({ message: 'Utilisateur enregistré avec succès.', user: newUser.rows[0] });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'utilisateur.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.rows[0].id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
