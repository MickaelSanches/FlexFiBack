const cron = require("node-cron");
const bnplService = require("./services/bnplServices");

// Planifier la tâche pour qu'elle s'exécute tous les jours à minuit
cron.schedule("0 0 * * *", async () => {
  console.log("Vérification des paiements BNPL dus...");

  try {
    // Appeler la méthode pour vérifier et traiter les paiements
    await bnplService.schedulePayments();
    console.log("Paiements BNPL vérifiés et traités avec succès.");
  } catch (error) {
    console.error("Erreur lors de la vérification des paiements BNPL :", error);
  }
});
