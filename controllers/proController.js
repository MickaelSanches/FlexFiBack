const userService = require("../services/userService");
const externalApiService = require("../services/externalApiService");

exports.validateBusinessInfo = async (req, res) => {
  console.log("Received Body:", req.body);
  const { sirenOrSiret } = req.body;

  if (!sirenOrSiret) {
    return res.status(400).json({ error: "sirenOrSiret is required" });
  }

  try {
    const businessInfo = await externalApiService.getBusinessInfo(sirenOrSiret);
    res.json({
      message: "Business information retrieved successfully.",
      data: businessInfo,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.generateSeed = (_, res) => {
  const seedPhrase = userService.generateSeedPhrase();
  res.json({ message: "Seed phrase generated successfully.", seedPhrase });
};
