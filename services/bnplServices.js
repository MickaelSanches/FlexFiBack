const solanaService = require("../services/solanaService");
const db = require("../db");

class BNPLService {
// Calcul des détails BNPL (frais, mensualités, etc.)
calculateBNPLDetails(amount, months) {
    // Frais pour le shopper (12 %)
    const shopperFee = parseFloat((amount * 0.12).toFixed(5));
    const shopperTotal = parseFloat((amount + shopperFee).toFixed(5));

    // Frais pour le marchand (2 %)
    const merchantFee = parseFloat((amount * 0.02).toFixed(5));

    // Calcul des mensualités en divisant le montant total du shopper par le nombre de mois
    const monthlyPaymentShopper = parseFloat((shopperTotal / months).toFixed(5));

    console.log("Calculs BNPL Détails:");
    console.log(`Montant: ${amount}, Mois: ${months}`);
    console.log(`Frais Shopper: ${shopperFee}, Total Shopper: ${shopperTotal}`);
    console.log(`Frais Marchand: ${merchantFee}, Mensualité Shopper: ${monthlyPaymentShopper}`);

    return {
        shopperFee,
        merchantFee,
        shopperTotal,
        monthlyPaymentShopper
    };
}


    // Génération de l'échéancier des paiements BNPL
    generatePaymentSchedule(amount, months, saleId, startDate) {
        const schedule = [];
        const { shopperTotal, monthlyPaymentShopper } = this.calculateBNPLDetails(amount, months);
        let totalScheduled = 0;
    
        console.log("Génération de l'échéancier des paiements:");
        console.log(`Montant Total: ${shopperTotal}, Mensualité: ${monthlyPaymentShopper}`);
    
        for (let i = 0; i < months; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
    
            let paymentAmount;
            // Ajuster la dernière mensualité pour s'assurer que le total est correct
            if (i === months - 1) {
                paymentAmount = parseFloat((shopperTotal - totalScheduled).toFixed(5));
            } else {
                paymentAmount = monthlyPaymentShopper;
            }
    
            totalScheduled += paymentAmount;
    
            console.log(`Mensualité ${i + 1}: ${paymentAmount} (Échéance: ${paymentDate.toISOString()})`);
    
            schedule.push({
                sale_id: saleId,
                month_number: i + 1,
                payment_amount: paymentAmount,
                due_date: paymentDate,
                paid: false,
                payment_hash: null
            });
        }
    
        console.log(`Total Programmé: ${totalScheduled}`);
        return schedule;
    }    

// Planification des paiements à exécuter à la date d'échéance
async schedulePayments() {
    const today = new Date().toISOString().split('T')[0]; // Date du jour

    // Récupérer toutes les échéances à payer aujourd'hui, incluant la clé privée de l'acheteur depuis la table 'users'
    const paymentsDue = await db.query(`
        SELECT bnpl_schedules.*, bnpl_sales.buyer_pubkey, users.private_key 
        FROM bnpl_schedules 
        INNER JOIN bnpl_sales ON bnpl_schedules.sale_id = bnpl_sales.id
        INNER JOIN users ON bnpl_sales.buyer_pubkey = users.public_key
        WHERE bnpl_schedules.due_date = $1 AND bnpl_schedules.paid = false
    `, [today]);

    for (const payment of paymentsDue.rows) {
        try {
            // Vérification de la clé privée de l'acheteur
            if (!payment.private_key) {
                throw new Error('Clé privée de l’acheteur manquante');
            }

            let buyerPrivateKey;
            try {
                // Si la clé privée est stockée sous forme de chaîne JSON, la parser
                buyerPrivateKey = JSON.parse(payment.private_key);
            } catch (err) {
                throw new Error('Erreur lors du parsing de la clé privée de l’acheteur');
            }

            // Vérifier que la clé privée est bien un tableau de nombres
            if (!Array.isArray(buyerPrivateKey)) {
                throw new Error('La clé privée de l’acheteur n’est pas un tableau valide.');
            }

            // Effectuer la transaction Solana pour le prélèvement
            const paymentHash = await solanaService.transferBNPLPayment(
                buyerPrivateKey, // Clé privée correctement formatée
                process.env.FLEXFI_PUBLIC_KEY, // Clé publique FlexFi
                payment.payment_amount
            );

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
        const { shopperFee, merchantFee, shopperTotal, monthlyPaymentShopper } = this.calculateBNPLDetails(amount, months);

        // Avancer les fonds au marchand
        await this.advanceFundsToMerchant(sellerPubKey, amount);

        // Ajouter la nouvelle vente BNPL dans la table bnpl_sales
        console.log("Création de la vente BNPL dans la base de données...");
        const newSale = await db.query(
            `INSERT INTO bnpl_sales (seller_pubkey, buyer_pubkey, amount, months, monthly_payment, shopper_fee, merchant_fee, currency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [sellerPubKey, buyerPubKey, amount, months, monthlyPaymentShopper, shopperFee, merchantFee, 'SOL']
        );
    
        const sale = newSale.rows[0];

        console.log("Génération de l'échéancier pour la vente...");
        const paymentSchedule = this.generatePaymentSchedule(amount, months, sale.id, new Date());
        for (const payment of paymentSchedule) {
            await db.query(
                `INSERT INTO bnpl_schedules (sale_id, month_number, payment_amount, due_date)
                 VALUES ($1, $2, $3, $4)`,
                [payment.sale_id, payment.month_number, payment.payment_amount, payment.due_date]
            );
            console.log(`Mensualité ajoutée: Mois ${payment.month_number}, Montant: ${payment.payment_amount}`);
        }

        return sale;
    } catch (error) {
        console.error("Erreur lors de la création de la vente BNPL :", error);
        throw new Error("Impossible de créer la vente BNPL");
    }
}

// Avancer les fonds au marchand
async advanceFundsToMerchant(sellerPubKey, amount) {
    try {
        // Récupérer la clé privée de FlexFi
        const flexFiWallet = await db.query("SELECT * FROM flexfi LIMIT 1");
        const flexFiPrivateKeyString = flexFiWallet.rows[0].private_key;
        
        // Convertir la chaîne JSON en tableau de nombres
        const flexFiPrivateKeyArray = JSON.parse(flexFiPrivateKeyString);

        // Convertir en Uint8Array
        const privateKeyArray = Uint8Array.from(flexFiPrivateKeyArray);

        // Transfert de l'avance de fonds au marchand
        const advanceAmount = parseFloat((amount * 0.98).toFixed(2));
        const transactionSignature = await solanaService.sendTransaction(
            privateKeyArray,
            sellerPubKey,
            advanceAmount
        );

        console.log(`Transfert de ${advanceAmount} SOL au marchand avec signature : ${transactionSignature}`);
        return transactionSignature;
    } catch (error) {
        console.error("Erreur lors de l'avance de fonds au marchand :", error);
        throw new Error("Impossible d'avancer les fonds au marchand");
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

        // Récupérer le wallet FlexFi
        const flexFiWallet = await db.query("SELECT * FROM flexfi LIMIT 1");
        const flexFiPublicKey = flexFiWallet.rows[0].public_key;

        // Transférer la mensualité au wallet FlexFi
        const signature = await solanaService.transferBNPLPayment(
            buyerPrivateKey,
            flexFiPublicKey,
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
