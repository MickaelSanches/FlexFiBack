const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bip39 = require('bip39');
const nodemailer = require('nodemailer');
const userMapper = require('../mappers/userMapper');

class UserService {
  generateSeedPhrase() {
    return bip39.generateMnemonic();
  }

  async getSeedPhrase(email, password) {
    const user = await userMapper.findUserByEmail(email);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Mot de passe incorrect');
    }

    return user.seed_phrase;
  }

  validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,128}$/;
    return passwordRegex.test(password);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  createJwtToken(userId) {
    const payload = { user: { id: userId } };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  async sendEmail(email, subject, text) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.zoho.eu",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    });
  }

  async checkUserExists(email) {
    const user = await userMapper.findUserByEmail(email);
    return !!user;
  }

  async registerUser(email, password) {
    const emailExists = await this.checkUserExists(email);
    if (emailExists) {
      throw new Error('User already exists');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be between 8 and 128 characters long, and include at least one digit and one uppercase letter.');
    }

    const seedPhrase = this.generateSeedPhrase();
    const hashedPassword = await this.hashPassword(password);
    return userMapper.createUser(email, hashedPassword, seedPhrase);
  }

  async registerProfessional(email, password, businessInfo) {
    const emailExists = await this.checkUserExists(email);
    if (emailExists) {
        throw new Error('User already exists');
    }

    if (!this.validatePassword(password)) {
        throw new Error('Password must be between 8 and 128 characters long, and include at least one digit and one uppercase letter.');
    }

    const seedPhrase = this.generateSeedPhrase();
    const hashedPassword = await this.hashPassword(password);
    
    // Crée l'utilisateur professionnel et récupère son ID
    const user = await userMapper.createUser(email, hashedPassword, seedPhrase, 'pending');

    // Insère les informations professionnelles dans la table business_info
    await userMapper.insertBusinessInfo(user.id, businessInfo);

    return user;
}

  async loginUser(email, password) {
    const user = await userMapper.findUserByEmail(email);
    if (!user || !(await this.comparePassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    return this.createJwtToken(user.id);
  }

  async sendVerificationEmail(email) {
    // Check if the email is already registered
    const emailExists = await this.checkUserExists(email);
    if (emailExists) {
      throw new Error('This email is already registered. Please use another email or log in.');
    }

    // Generate a verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    // Send the verification email
    await this.sendEmail(email, 'Your Verification Code', `Your verification code is: ${verificationCode}. This code is valid for 30 minutes.`);

    // Store the verification code in the database
    await userMapper.insertVerificationCode(email, verificationCode, new Date(Date.now() + 30 * 60000));
  }

  async verifyEmail(email, code) {
    const verification = await userMapper.findVerificationCode(email, code);
    if (!verification) {
      throw new Error('Invalid or expired verification code');
    }
    return verification;
  }

  async setPassword(email, password) {
    const user = await userMapper.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!this.validatePassword(password)) {
      const error = new Error('Password must be between 8 and 128 characters long, and include at least one digit and one uppercase letter.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await this.hashPassword(password);
    const result = await userMapper.updateUserPassword(email, hashedPassword);
    return result;
  }

  async sendConfirmationEmail(email) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    await this.sendEmail(email, 'Confirmation of your registration', `Thank you for registering. Here is your confirmation code: ${verificationCode}.`);
    await userMapper.insertVerificationCode(email, verificationCode, new Date(Date.now() + 30 * 60000));
  }
}

module.exports = new UserService();
