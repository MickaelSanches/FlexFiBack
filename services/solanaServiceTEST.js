// const solanaWeb3 = require("@solana/web3.js");
// const anchor = require("@project-serum/anchor");

// class SolanaService {
//   constructor() {
//     // Initialiser AnchorProvider avec l'URL de connexion définie dans .env
//     const connection = new anchor.web3.Connection(process.env.ANCHOR_PROVIDER_URL);

//     // Créer un wallet à partir d'une clé privée ou générer une nouvelle paire de clés
//     const wallet = new anchor.Wallet(solanaWeb3.Keypair.generate());  // Remplace par un Keypair valide si nécessaire
//     const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });

//     anchor.setProvider(provider);

//     // Initialiser le programme ID du smart contract
//     this.programId = new anchor.web3.PublicKey('GZYx7tr7vmLp92WgCfyaPmP68zm15RdSiCt31D9fUDoV'); // ID du programme
//     // Charger l'IDL associée au smart contract
//     this.program = new anchor.Program(require('../idl/idl.json'), this.programId, provider);
//   }

//   // Méthode pour générer un nouveau wallet Solana
//   generateWallet() {
//     const newWallet = solanaWeb3.Keypair.generate();
//     const publicKey = newWallet.publicKey.toString();
//     const privateKey = Array.from(newWallet.secretKey);

//     return { publicKey, privateKey };
//   }

//   // Méthode pour créer un wallet via le smart contract
//   async createWallet(ownerPrivateKey) {
//     try {
//       const owner = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(ownerPrivateKey));

//       // Créer l'adresse du wallet utilisateur avec un PDA (Program Derived Address)
//       const [userWallet, _] = await solanaWeb3.PublicKey.findProgramAddress(
//         [owner.publicKey.toBuffer()],
//         this.programId
//       );

//       // Appeler l'instruction "create_wallet" de ton smart contract
//       await this.program.rpc.createWallet({
//         accounts: {
//           userWallet: userWallet,
//           owner: owner.publicKey,
//           systemProgram: solanaWeb3.SystemProgram.programId
//         },
//         signers: [owner]
//       });

//       console.log('Wallet créé avec succès pour:', owner.publicKey.toString());
//       return userWallet.toString();

//     } catch (error) {
//       console.error('Erreur lors de la création du wallet:', error);
//       throw new Error('Échec de la création du wallet');
//     }
//   }

//   async depositSol(senderPrivateKey, amount) {
//     try {
//         const sender = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(senderPrivateKey));

//         const [senderWallet, _] = await solanaWeb3.PublicKey.findProgramAddress(
//             [sender.publicKey.toBuffer()],
//             this.programId
//         );

//         // Ajout de la simulation avant la transaction
//         const connection = new solanaWeb3.Connection(process.env.ANCHOR_PROVIDER_URL, 'confirmed');
//         const transaction = new solanaWeb3.Transaction().add(
//             solanaWeb3.SystemProgram.transfer({
//                 fromPubkey: sender.publicKey,
//                 toPubkey: senderWallet,
//                 lamports: solanaWeb3.LAMPORTS_PER_SOL * amount,
//             })
//         );

//         // Simuler la transaction pour obtenir les logs
//         const simulationResult = await connection.simulateTransaction(transaction, [sender]);
//         if (simulationResult.value.err) {
//             console.error('Simulation de la transaction échouée:', simulationResult.value.logs);
//             throw new Error('Simulation échouée');
//         }

//         await this.program.rpc.depositSol(new anchor.BN(amount), {
//             accounts: {
//                 userWallet: senderWallet,
//                 owner: sender.publicKey,
//                 systemProgram: solanaWeb3.SystemProgram.programId,
//             },
//             signers: [sender],
//         });

//         console.log(`SOL crédité : ${amount} SOL dans le programme`);
//     } catch (error) {
//         console.error('Erreur lors du dépôt de SOL:', error);
//         throw new Error('Échec du dépôt de SOL');
//     }
// }

//   async initializeAccountIfNeeded(payer, publicKey, programId) {
//     const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
// const airdropSignature = await connection.requestAirdrop(
//   new solanaWeb3.PublicKey(sender.publicKey),
//   solanaWeb3.LAMPORTS_PER_SOL
// );
// await connection.confirmTransaction(airdropSignature);

//     const accountInfo = await connection.getAccountInfo(new solanaWeb3.PublicKey(publicKey));
//     if (!accountInfo) {
//       console.log(`Initialisation du compte pour: ${publicKey}`);

//       // Générer une nouvelle paire de clés pour le nouveau compte
//       const newAccount = solanaWeb3.Keypair.generate();

//       // Créer le nouveau compte avec cette paire de clés
//       const lamports = await connection.getMinimumBalanceForRentExemption(0);  // Ajuste selon le type de compte

//       const transaction = new solanaWeb3.Transaction().add(
//         solanaWeb3.SystemProgram.createAccount({
//           fromPubkey: payer.publicKey,  // L'expéditeur (payer) paie la transaction
//           newAccountPubkey: newAccount.publicKey,
//           lamports: lamports,
//           space: 0,  // Ajuster selon les besoins
//           programId: programId,  // ID du programme
//         })
//       );

//       // Signer la transaction avec la clé privée du payer et du nouveau compte
//       const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [payer, newAccount]);
//       console.log('Compte initialisé avec succès. Signature de la transaction:', signature);

//       return newAccount;
//     } else {
//       console.log(`Le compte ${publicKey} est déjà initialisé.`);
//     }
//   }

//   // Méthode pour envoyer des paiements directs via le smart contract
//   async directPayment(senderPrivateKey, recipientPublicKey, amount, asset) {
//     try {
//       const sender = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(senderPrivateKey));

//       // Vérifier les comptes et initialiser si nécessaire
//       const [senderWallet, _] = await solanaWeb3.PublicKey.findProgramAddress(
//         [sender.publicKey.toBuffer()],
//         this.programId
//       );
//       const recipientWallet = new solanaWeb3.PublicKey(recipientPublicKey);

//       // Vérifier le solde de l'expéditeur
//       const senderSolBalance = await this.getSolBalance(sender.publicKey);
//       const recipientSolBalance = await this.getSolBalance(recipientWallet);

//       console.log(`Solde de l'expéditeur: ${senderSolBalance} SOL`);
//       console.log(`Solde du destinataire: ${recipientSolBalance} SOL`);

//       // Assurez-vous que l'expéditeur a suffisamment de SOL pour la transaction
//       if (senderSolBalance < amount) {
//         throw new Error(`Le compte de l'expéditeur n'a pas suffisamment de SOL pour cette transaction.`);
//       }

//       // Simuler la transaction avant l'envoi
//       const simulationResult = await this.simulateTransaction(sender, recipientWallet, amount, asset);
//       if (simulationResult.value.err) {
//         console.log('Échec de la simulation:', simulationResult.value.logs);
//         throw new Error('Simulation de la transaction échouée.');
//       }

//       // Appeler l'instruction "direct_payment" du smart contract
//       await this.program.rpc.directPayment(new anchor.BN(amount), 'SOL', {
//         accounts: {
//           userWallet: senderWallet,
//           recipientWallet: recipientWallet,
//           owner: sender.publicKey,
//         },
//         signers: [sender],
//       });

//       console.log(`Transaction réussie : ${amount} ${asset} envoyé à ${recipientPublicKey}`);
//     } catch (error) {
//       console.error('Erreur lors de l\'envoi du paiement:', error);
//       throw new Error('La transaction a échoué');
//     }
//   }

//   // Méthode pour simuler une transaction (facultatif, utile pour déboguer avant l'envoi)
//   async simulateTransaction(sender, recipientWallet, amount, asset) {
//     const connection = new solanaWeb3.Connection(process.env.ANCHOR_PROVIDER_URL, 'confirmed');
//     const transaction = new solanaWeb3.Transaction().add(
//       solanaWeb3.SystemProgram.transfer({
//         fromPubkey: sender.publicKey,
//         toPubkey: recipientWallet,
//         lamports: solanaWeb3.LAMPORTS_PER_SOL * amount,  // Conversion SOL -> lamports
//       })
//     );
//     const simulationResult = await connection.simulateTransaction(transaction, [sender]);

//     // Capturer les logs pour diagnostiquer
//     if (simulationResult.value.err) {
//       console.log('Échec de la simulation, logs:', simulationResult.value.logs);
//     }

//     return simulationResult;
//   }

//   // Méthode pour vérifier le solde d'un wallet utilisateur
//   async getWalletBalance(ownerPublicKey, asset) {
//     try {
//       const ownerPubKey = new solanaWeb3.PublicKey(ownerPublicKey);

//       // Créer l'adresse du wallet utilisateur avec un PDA
//       const [userWallet, _] = await solanaWeb3.PublicKey.findProgramAddress(
//         [ownerPubKey.toBuffer()],
//         this.programId
//       );

//       // Appeler la méthode RPC "get_wallet_balance" avec l'asset spécifique
//       const balance = await this.program.account.userWallet.fetch(userWallet);
//       console.log('Balance pour', asset, ':', balance[`balance_${asset.toLowerCase()}`]);

//       return balance[`balance_${asset.toLowerCase()}`];
//     } catch (error) {
//       console.error('Erreur lors de la récupération du solde du wallet:', error);
//       throw new Error('Impossible de récupérer le solde');
//     }
//   }

//   // Méthode pour vérifier le solde SOL d'un compte sur le réseau Solana
//   async getSolBalance(publicKey) {
//     const connection = new solanaWeb3.Connection(process.env.ANCHOR_PROVIDER_URL, 'confirmed');
//     const balance = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
//     console.log(`Solde pour ${publicKey}:`, balance / solanaWeb3.LAMPORTS_PER_SOL, "SOL");
//     return balance / solanaWeb3.LAMPORTS_PER_SOL;
//   }

//   async checkWalletInProgram(walletPublicKey, asset) {
//     try {
//       const account = await this.program.account.userWallet.fetch(walletPublicKey);
//       const balance = account[`balance_${asset.toLowerCase()}`];

//       console.log(`Solde pour ${asset} dans le programme pour ${walletPublicKey}:`, balance);
//       return balance;
//     } catch (error) {
//       console.error('Erreur lors de la vérification du solde dans le programme:', error);
//       throw new Error('Impossible de vérifier le solde dans le programme');
//     }
//   }
// }

// module.exports = new SolanaService();
