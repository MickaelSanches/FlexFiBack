const solanaWeb3 = require("@solana/web3.js");

class SolanaService {
  // Méthode pour générer un nouveau wallet Solana
  generateWallet() {
    const newWallet = solanaWeb3.Keypair.generate();
    const publicKey = newWallet.publicKey.toString();
    const privateKey = Array.from(newWallet.secretKey);

    return { publicKey, privateKey };
  }
}

module.exports = new SolanaService();
