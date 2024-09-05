const solanaWeb3 = require("@solana/web3.js");

class SolanaService {
  // Méthode pour générer un nouveau wallet Solana
  generateWallet() {
    const newWallet = solanaWeb3.Keypair.generate();
    const publicKey = newWallet.publicKey.toString();
    const privateKey = Array.from(newWallet.secretKey);

    return { publicKey, privateKey };
  }

  // Méthode pour envoyer une transaction Solana
  async sendTransaction(senderPrivateKey, recipientPublicKey, amount) {
    try {
      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
      
      // Convertir la clé privée de l'expéditeur en Keypair
      const senderWallet = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(senderPrivateKey));

      // Construire la transaction
      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: senderWallet.publicKey,
          toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
          lamports: solanaWeb3.LAMPORTS_PER_SOL * amount,  // Conversion de SOL en lamports
        })
      );

      // Envoyer et confirmer la transaction
      const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [senderWallet]);
      console.log('Transaction réussie avec signature:', signature);
      return signature;

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la transaction:', error);
      throw new Error('La transaction a échoué');
    }
  }

  // Méthode pour récupérer l'historique des transactions
  async getTransactionHistory(publicKey) {
    try {
      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('testnet'), 'confirmed');
      
      // Utiliser getSignaturesForAddress à la place
      const signatures = await connection.getSignaturesForAddress(new solanaWeb3.PublicKey(publicKey));
      const transactions = [];
  
      for (const signatureInfo of signatures) {
        const transaction = await connection.getConfirmedTransaction(signatureInfo.signature);
        transactions.push(transaction);
      }
  
      return transactions;
  
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des transactions:', error);
      throw new Error('Impossible de récupérer l\'historique des transactions');
    }
  }
}

module.exports = new SolanaService();

