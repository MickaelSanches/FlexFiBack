const simulateBNPL = (req, res) => {
    const { amount, months } = req.body;  // Montant de l'achat et durée en mois (6 ou 12)

    if (months !== 6 && months !== 12) {
        return res.status(400).json({ error: "Durée de paiement non valide. Choisissez 6 ou 12 mois." });
    }

    // Calcul pour le Shopper avec frais de 12%
    const shopperTotal = amount * 1.12;
    const monthlyPaymentShopper = shopperTotal / months;

    // Calcul pour le Commerçant avec frais de 2%
    const merchantTotal = amount * 1.02;

    return res.status(200).json({
        totalCostShopper: shopperTotal.toFixed(2),
        monthlyPaymentShopper: monthlyPaymentShopper.toFixed(2),
        totalCostMerchant: merchantTotal.toFixed(2)
    });
};

module.exports = { simulateBNPL };