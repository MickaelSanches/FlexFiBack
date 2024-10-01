const kycService = require('../services/kycService');

class KYCController {
    // Endpoint pour initier le KYC pour un utilisateur
    async initiateKYC(req, res) {
        const { userId } = req.body;

        try {
            const kycResult = await kycService.startKYCProcess(userId);
            return res.status(200).json({ message: 'KYC process initiated', kycResult });
        } catch (error) {
            console.error('Erreur lors de l\'initiation du KYC:', error);
            return res.status(500).json({ error: 'Erreur lors de l\'initiation du KYC' });
        }
    }

    // Endpoint pour vérifier le statut KYC d'un utilisateur
    async checkKYCStatus(req, res) {
        const { userId } = req.params;

        try {
            const kycStatus = await kycService.getKYCStatus(userId);
            return res.status(200).json({ kycStatus });
        } catch (error) {
            console.error('Erreur lors de la vérification du statut KYC:', error);
            return res.status(500).json({ error: 'Erreur lors de la vérification du statut KYC' });
        }
    }
    
    // Endpoint pour valider ou rejeter manuellement un KYC (si besoin)
    async updateKYCStatus(req, res) {
        const { userId, status } = req.body;

        try {
            await kycService.updateKYCStatus(userId, status);
            return res.status(200).json({ message: 'KYC status updated successfully' });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut KYC:', error);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut KYC' });
        }
    }
}

module.exports = new KYCController();
