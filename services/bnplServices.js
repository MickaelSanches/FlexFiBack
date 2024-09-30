// bnplServices.js
const solanaService = require("../services/solanaService");
const db = require("../db");

class BNPLService {
    // Calcul des détails BNPL (frais, mensualités, etc.)
    calculateBNPLDetails(amount, months) {
        // Frais pour le shopper (12 %)
        const shopperFee = amount * 0.12;
        const shopperTotal = amount + shopperFee; // Montant total pour le shopper

        // Frais pour le marchand (2 %)
        const merchantFee = amount * 0.02;
        const merchantTotal = amount - merchantFee; // Montant total reçu par le marchand

        // Calcul des mensualités
        const monthlyPaymentShopper = parseFloat((shopperTotal / months).toFixed(2));

        return {
            shopperFee,
            merchantFee,
            shopperTotal,
            merchantTotal,
            monthlyPaymentShopper
        };
    }

    // Génération de l'échéancier des paiements BNPL
    generatePaymentSchedule(amount, months, saleId, startDate) {
        const schedule = [];
        const monthlyAmount = parseFloat((amount / months).toFixed(2));

        for (let i = 0; i < months; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);

            schedule.push({
                sale_id: saleId,
                month_number: i + 1,
                payment_amount: monthlyAmount,
                due_date: paymentDate,
                paid: false,
                payment_hash: null
            });
        }

        return schedule;
    }

    // Planification des paiements à exécuter à la date d'échéance
    async schedulePayments() {
        const today = new Date().toISOString().split('T')[0]; // Date du jour
        
        // Récupérer toutes les échéances à payer aujourd'hui
        const paymentsDue = await db.query('SELECT * FROM bnpl_schedules WHERE due_date = $1 AND paid = false', [today]);

        for (const payment of paymentsDue.rows) {
            try {
                // Effectuer la transaction Solana pour le prélèvement
                const paymentHash = await solanaService.transferBNPLPayment(payment.sale_id, payment.payment_amount);
                
                // Mettre à jour la table avec la transaction réussie
                await db.query('UPDATE bnpl_schedules SET paid = true, payment_hash = $1 WHERE id = $2', [paymentHash, payment.id]);
                
                console.log(`Paiement BNPL réussi pour l'échéance ID ${payment.id} avec hash ${paymentHash}`);
            } catch (error) {
                console.error(`Erreur lors du paiement de l'échéance ID ${payment.id}:`, error);
                // Gestion des erreurs pour notifier les utilisateurs
            }
        }
    }

    // Créer une nouvelle transaction BNPL
    async createBNPLSale(sellerPubKey, buyerPubKey, amount, months) {
        try {
            // Calcul des frais et des mensualités
            const shopperFee = parseFloat((amount * 0.12).toFixed(2));
            const shopperTotal = amount + shopperFee;
            const monthlyPayment = parseFloat((shopperTotal / months).toFixed(2));
    
            // Calcul de la date d'échéance initiale (1 mois après la vente)
            let dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + 1);
    
            // Ajouter la nouvelle vente BNPL dans la table bnpl_sales
            const newSale = await db.query(
                `INSERT INTO bnpl_sales (seller_pubkey, buyer_pubkey, amount, months, monthly_payment, due_date, details, shopper_fee, merchant_fee, currency)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [sellerPubKey, buyerPubKey, amount, months, monthlyPayment, dueDate, {}, shopperFee, amount * 0.02, 'SOL']
            );
    
            const sale = newSale.rows[0];
    
            // Générer l'échéancier
            for (let i = 0; i < months; i++) {
                let paymentDueDate = new Date(dueDate);
                paymentDueDate.setMonth(paymentDueDate.getMonth() + i);
    
                await db.query(
                    `INSERT INTO bnpl_schedules (sale_id, month_number, payment_amount, due_date)
                     VALUES ($1, $2, $3, $4)`,
                    [sale.id, i + 1, monthlyPayment, paymentDueDate]
                );
            }
    
            return sale;
        } catch (error) {
            console.error("Erreur lors de la création de la vente BNPL :", error);
            throw new Error("Impossible de créer la vente BNPL");
        }
    }
    

    // Payer une mensualité BNPL
    async payBNPLInstallment(buyerPrivateKey, saleId) {
        try {
            // Récupérer la vente depuis la base de données
            const sale = await db.query("SELECT * FROM bnpl_sales WHERE id = $1", [saleId]);

            if (sale.rows.length === 0) {
                throw new Error("Vente introuvable");
            }

            const saleDetails = sale.rows[0];

            // Effectuer le transfert de la mensualité
            const signature = await solanaService.transferBNPLPayment(
                buyerPrivateKey,
                saleDetails.seller_pubkey,
                saleDetails.monthly_payment
            );

            console.log("Paiement de la mensualité réussi :", signature);

            // Mettre à jour la base de données pour marquer la mensualité comme payée
            await db.query(
                "UPDATE bnpl_sales SET paid = true, transaction_id = $1 WHERE id = $2",
                [signature, saleId]
            );

            return { message: "Paiement de la mensualité réussi", signature };
        } catch (error) {
            console.error("Erreur lors du paiement de la mensualité BNPL :", error);
            throw new Error("Impossible de payer la mensualité BNPL");
        }
    }

    // Récupérer les détails d'une vente BNPL
    async getBNPLSaleDetails(saleId) {
        try {
            const sale = await db.query(
                `SELECT * FROM bnpl_sales WHERE id = $1`,
                [saleId]
            );
    
            if (sale.rows.length === 0) {
                throw new Error("Vente BNPL introuvable");
            }
    
            // Récupérer l'échéancier
            const schedule = await db.query(
                `SELECT * FROM bnpl_schedules WHERE sale_id = $1 ORDER BY month_number ASC`,
                [saleId]
            );
    
            return { ...sale.rows[0], schedule: schedule.rows };
        } catch (error) {
            console.error("Erreur lors de la récupération des détails de la vente BNPL :", error);
            throw new Error("Impossible de récupérer les détails de la vente BNPL");
        }
    }


    // Récupérer toutes les ventes BNPL pour un utilisateur (marchand ou acheteur)
    async getUserBNPLSales(userPubKey) {
        try {
            const sales = await db.query(
                `SELECT * FROM bnpl_sales WHERE seller_pubkey = $1 OR buyer_pubkey = $1`,
                [userPubKey]
            );

            return sales.rows;
        } catch (error) {
            console.error("Erreur lors de la récupération des ventes BNPL de l'utilisateur :", error);
            throw new Error("Impossible de récupérer les ventes BNPL de l'utilisateur");
        }
    }
}

module.exports = new BNPLService();
