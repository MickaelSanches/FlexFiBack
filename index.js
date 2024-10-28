const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
// const router = require("./router/router");
const authRoutes = require("./router/authRoutes");
const proRoutes = require("./router/proRoutes");
const solanaRoutes = require("./router/solanaRoutes");
const bnplRoutes = require("./router/bnplRoutes");
const kycRoutes = require("./router/kycRoutes");

dotenv.config();

const app = express();
app.use(express.json());

// Connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.log(err));

console.log("Database Name:", process.env.DB_NAME);
console.log("Database Name:", process.env.DB_PASS);
console.log("Database Name:", process.env.DB_USER);

app.use(cors({ origin: "https://flexfiback.onrender.com/" }));

// Routes pour l'authentification
app.use("/auth", authRoutes);

// Routes pour les informations professionnelles
app.use("/pro", proRoutes);

// Routes pour les transactions Solana
app.use("/solana", solanaRoutes);

// Route pour la simulation BNPL
app.use("/bnpl", bnplRoutes);

// Routes pour le KYC
app.use("/kyc", kycRoutes);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
