const userService = require("../services/userService");
const solanaService = require("../services/solanaService");
const { getBusinessInfo } = require("../services/externalApiService");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Générer un utilisateur et un wallet, mais ne pas l'enregistrer sur la blockchain
    const user = await userService.registerUser(email, password);

    res.json({
      message: "User successfully registered.",
      seed_phrase: user.seed_phrase,
      public_key: user.public_key, // Clé publique du wallet
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.registerProfessional = async (req, res) => {
  const { email, password, siren } = req.body;
  let businessInfo;

  try {
    // Récupérer les informations de l'entreprise à partir du SIREN
    businessInfo = await getBusinessInfo(siren);
  } catch (error) {
    console.error("Error fetching business info:", error.message);
    return res
      .status(400)
      .json({ error: "Unable to retrieve business information." });
  }

  try {
    // Enregistrer l'utilisateur professionnel avec les informations de l'entreprise
    const user = await userService.registerProfessional(
      email,
      password,
      businessInfo
    );

    res.json({
      message: "User successfully registered.",
      seed_phrase: user.seed_phrase,
      public_key: user.public_key,
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = await userService.loginUser(email, password);
    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifie si l'utilisateur existe déjà
    const userExists = await userService.checkUserExists(email);
    if (userExists) {
      return res
        .status(400)
        .json({ error: "This email is already registered." });
    }

    // Si l'utilisateur n'existe pas, envoie le code de vérification
    await userService.sendVerificationEmail(email);
    res.json({ message: "Code de vérification envoyé." });
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de l'email de vérification :",
      error.message
    );
    res
      .status(500)
      .json({ error: "Erreur lors de l'envoi de l'email de vérification." });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    await userService.verifyEmail(email, code);
    res.json({ message: "Email successfully verified." });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await userService.setPassword(email, password);
    res.json({ message: "Password successfully set.", user: result });
  } catch (error) {
    console.error("Error setting password:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.getSeedPhrase = async (req, res) => {
  const { email, password } = req.body;

  try {
    const seedPhrase = await userService.getSeedPhrase(email, password);
    res.json({ seed_phrase: seedPhrase });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la seed phrase:",
      error.message
    );
    res.status(400).json({ error: error.message });
  }
};

exports.sendConfirmationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    await userService.sendConfirmationEmail(email);
    res.json({ message: "Confirmation email sent." });
  } catch (error) {
    console.error("Error sending confirmation email:", error.message);
    res.status(500).json({ error: "Error sending confirmation email." });
  }
};
