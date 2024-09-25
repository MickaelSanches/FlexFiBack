const solanaWeb3 = require("@solana/web3.js");
const anchor = require("@project-serum/anchor");

class SolanaService {
  // Méthode pour générer un nouveau wallet Solana
  generateWallet() {
    const newWallet = solanaWeb3.Keypair.generate();
    const publicKey = newWallet.publicKey.toString();
    const privateKey = Array.from(newWallet.secretKey);

    return { publicKey, privateKey };
  }

  // Ajout de la méthode airdropSol pour créditer un wallet en SOL
  async airdropSol(publicKey) {
    try {
      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"), "confirmed");

      // Demande de 1 SOL du faucet Devnet
      const airdropSignature = await connection.requestAirdrop(
        new solanaWeb3.PublicKey(publicKey),
        solanaWeb3.LAMPORTS_PER_SOL // 1 SOL
      );

      // Confirmation de la transaction d'airdrop
      await connection.confirmTransaction(airdropSignature);
      console.log(`1 SOL a été déposé sur le wallet ${publicKey}`);
    } catch (error) {
      console.error("Erreur lors de l'airdrop de SOL:", error);
      throw new Error("Erreur lors de l'approvisionnement du wallet en SOL");
    }
  }

// Méthode pour enregistrer un wallet sur la blockchain lors de la première transaction
async registerWalletOnChain(publicKey, privateKey) {
  try {
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"), "confirmed");

    // Vérifier si le wallet est déjà enregistré
    const accountInfo = await connection.getAccountInfo(new solanaWeb3.PublicKey(publicKey));
    if (accountInfo) {
      console.log("Wallet déjà enregistré sur la blockchain.");
      return; // Ne pas réinitialiser le wallet s'il existe déjà
    }

    // Enregistrement si le wallet n'existe pas encore
    const secretKeyArray = Uint8Array.from(privateKey); 
    const wallet = solanaWeb3.Keypair.fromSecretKey(secretKeyArray);

    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), anchor.AnchorProvider.defaultOptions());
    const idl = JSON.parse(require('fs').readFileSync('./idl/idl.json', 'utf8'));
    const programId = new solanaWeb3.PublicKey("GZYx7tr7vmLp92WgCfyaPmP68zm15RdSiCt31D9fUDoV");
    const program = new anchor.Program(idl, programId, provider);

    // Utilisation de findProgramAddress pour obtenir le bump
    const [userWalletPda, bump] = await solanaWeb3.PublicKey.findProgramAddress(
      [Buffer.from("user_wallet"), wallet.publicKey.toBuffer()],
      programId
    );

    // Appel RPC avec bump
    const tx = await program.rpc.createWallet(bump, {
      accounts: {
        userWallet: userWalletPda,
        owner: provider.wallet.publicKey,
        systemProgram: solanaWeb3.SystemProgram.programId,
      },
      signers: [wallet], // Signature du propriétaire
    });

    console.log("Transaction réussie pour l'enregistrement du wallet :", tx);
    return tx;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du wallet sur la blockchain :", error);
    throw new Error("Erreur lors de l'enregistrement sur la blockchain");
  }
}


  // Méthode pour envoyer une transaction Solana (paiement direct)
  async sendTransaction(senderPrivateKey, recipientPublicKey, amount) {
    try {
      const connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl("devnet"),
        "confirmed"
      );
      const senderWallet = solanaWeb3.Keypair.fromSecretKey(
        Uint8Array.from(senderPrivateKey)
      );

      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: senderWallet.publicKey,
          toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
          lamports: solanaWeb3.LAMPORTS_PER_SOL * amount, // Conversion de SOL en lamports
        })
      );

      const signature = await solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [senderWallet]
      );
      console.log("Transaction réussie avec signature:", signature);
      return signature;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la transaction:", error);
      throw new Error("La transaction a échoué");
    }
  }

  // Méthode pour effectuer un dépôt de SOL
  async depositSol(senderPrivateKey, amount) {
    try {
      const recipientPublicKey = "TonAdresseDeDépôtPublic"; // Adresse de dépôt fixe ou configurable
      return await this.sendTransaction(
        senderPrivateKey,
        recipientPublicKey,
        amount
      );
    } catch (error) {
      console.error("Erreur dans depositSol:", error);
      throw new Error("Erreur lors du dépôt de SOL");
    }
  }

  async directPayment(senderPrivateKey, recipientPublicKey, amount, asset) {
    try {
      // Effectuer la transaction sans réinitialiser le wallet
      if (asset === "SOL") {
        return await this.sendTransaction(
          senderPrivateKey,
          recipientPublicKey,
          amount
        );
      } else {
        // Gestion d'autres assets (par exemple, USDC, USDT, etc.)
        throw new Error("Asset non supporté pour le moment");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du paiement :", error);
      throw new Error("La transaction a échoué");
    }
  }

  // Méthode pour récupérer l'historique des transactions
  async getTransactionHistory(publicKey) {
    try {
      const connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl("devnet"), 
        "confirmed"
      );
  
      // Convertir la chaîne publicKey en objet PublicKey
      const pubKey = new solanaWeb3.PublicKey(publicKey);
  
      console.log(`Récupération des signatures pour l'adresse : ${pubKey}`);
  
      const signatures = await connection.getSignaturesForAddress(pubKey);
      const transactions = [];
  
      for (const signatureInfo of signatures) {
        // Remplacer getConfirmedTransaction par getTransaction
        const transaction = await connection.getTransaction(signatureInfo.signature);
        transactions.push(transaction);
      }
  
      return transactions;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des transactions :", error);
      throw new Error("Impossible de récupérer l'historique des transactions");
    }
  }

  // Méthode pour récupérer le solde du wallet
  async getWalletBalance(publicKey, asset) {
    try {
      const connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl("devnet"),
        "confirmed"
      );
      const balance = await connection.getBalance(
        new solanaWeb3.PublicKey(publicKey)
      );
      return balance / solanaWeb3.LAMPORTS_PER_SOL; // Conversion de lamports en SOL
    } catch (error) {
      console.error("Erreur dans getWalletBalance:", error);
      throw new Error("Erreur lors de la récupération du solde");
    }
  }
}

module.exports = new SolanaService();







