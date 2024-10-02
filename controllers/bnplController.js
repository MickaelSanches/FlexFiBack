const bnplService = require("../services/bnplServices");
const pdfService = require("../services/pdfService");
const db = require("../db");

class BNPLController {
  // Simuler une vente BNPL
  simulateBNPL(req, res) {
    const { amount, months } = req.body;

    if (months !== 6 && months !== 12) {
      return res
        .status(400)
        .json({
          error: "Durée de paiement non valide. Choisissez 6 ou 12 mois.",
        });
    }

    // Calcul pour le Shopper avec frais de 12%
    const shopperFee = amount * 0.12;
    const shopperTotal = parseFloat((amount + shopperFee).toFixed(5));
    const monthlyPaymentShopper = parseFloat(
      (shopperTotal / months).toFixed(5)
    );

    // Calcul pour le Commerçant avec frais de 2%
    const merchantFee = amount * 0.02;
    const totalCostMerchant = parseFloat((amount - merchantFee).toFixed(5));

    console.log("Simulation BNPL:");
    console.log(`Montant: ${amount}, Mois: ${months}`);
    console.log(`Frais Shopper: ${shopperFee}, Total Shopper: ${shopperTotal}`);
    console.log(`Mensualité Shopper: ${monthlyPaymentShopper}`);
    console.log(
      `Frais Marchand: ${merchantFee}, Total Marchand: ${totalCostMerchant}`
    );

    return res.status(200).json({
      totalCostShopper: shopperTotal.toFixed(5),
      monthlyPaymentShopper: monthlyPaymentShopper.toFixed(5),
      totalCostMerchant: totalCostMerchant.toFixed(5),
    });
  }

  // Créer une nouvelle vente BNPL
  async createBNPLSale(req, res) {
    const { sellerPubKey, buyerPubKey, amount, months } = req.body;
    try {
      const sale = await bnplService.createBNPLSale(
        sellerPubKey,
        buyerPubKey,
        amount,
        months
      );
      res.status(201).json({
        message: "Vente BNPL créée avec succès",
        sale,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la création de la vente BNPL ________CONTROLLER_______ :",
        error
      );
      res
        .status(500)
        .json({ error: "Erreur lors de la création de la vente BNPL" });
    }
  }

  // Payer une mensualité BNPL
  async payBNPLInstallment(req, res) {
    const { buyerPrivateKey, saleId } = req.body;
    try {
      const paymentResult = await bnplService.payBNPLInstallment(
        buyerPrivateKey,
        saleId
      );
      res.status(200).json({
        message: "Paiement de la mensualité réussi",
        paymentResult,
      });
    } catch (error) {
      console.error("Erreur lors du paiement de la mensualité BNPL :", error);
      res
        .status(500)
        .json({ error: "Erreur lors du paiement de la mensualité BNPL" });
    }
  }

  // Récupérer les détails d'une vente BNPL
  async getBNPLSaleDetails(req, res) {
    const { saleId } = req.params;
    try {
      const saleDetails = await bnplService.getBNPLSaleDetails(saleId);
      res.status(200).json(saleDetails);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de la vente BNPL :",
        error
      );
      res
        .status(500)
        .json({
          error: "Erreur lors de la récupération des détails de la vente BNPL",
        });
    }
  }

  // Récupérer toutes les ventes BNPL d'un utilisateur
  async getUserBNPLSales(req, res) {
    const { userPubKey } = req.params;
    try {
      const userSales = await bnplService.getUserBNPLSales(userPubKey);
      res.status(200).json(userSales);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des ventes BNPL de l'utilisateur :",
        error
      );
      res
        .status(500)
        .json({
          error:
            "Erreur lors de la récupération des ventes BNPL de l'utilisateur",
        });
    }
  }

  async downloadSchedulePDF(req, res) {
    const { saleId, type } = req.params;
    try {
      // Récupérer la vente
      const sale = await bnplService.getBNPLSaleDetails(saleId);

      // Récupérer l'échéancier de la vente
      const schedule = await db.query(
        "SELECT * FROM bnpl_schedules WHERE sale_id = $1 ORDER BY month_number",
        [saleId]
      );

      // Vérifier que l'échéancier est un tableau
      if (!Array.isArray(schedule.rows)) {
        console.error("schedule n'est pas un tableau :", schedule.rows);
        return res
          .status(500)
          .json({ error: "Erreur de format de données pour l'échéancier." });
      }

      // Générer le PDF en fonction du type (shopper ou merchant)
      const pdfBuffer = await pdfService.generateSchedulePDF(
        sale,
        schedule.rows,
        type
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="schedule_${type}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      res.status(500).json({ error: "Erreur lors de la génération du PDF" });
    }
  }
}

module.exports = new BNPLController();
