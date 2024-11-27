const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// Détecter l'environnement (production ou développement)
const isDevelopment = process.env.NODE_ENV !== "production";

// Connexion à PostgreSQL
const pool = new Pool({
  user: isDevelopment ? process.env.DB_USER_DEV : process.env.DB_USER,
  host: isDevelopment ? process.env.DB_HOST_DEV : process.env.DB_HOST,
  database: isDevelopment ? process.env.DB_NAME_DEV : process.env.DB_NAME,
  password: isDevelopment
    ? String(process.env.DB_PASS_DEV)
    : String(process.env.DB_PASS),
  port: isDevelopment ? process.env.DB_PORT_DEV : process.env.DB_PORT || 5000,
});

pool
  .connect()
  .then(() => {
    console.log(
      `Connected to PostgreSQL (${
        isDevelopment ? "Development" : "Production"
      })`
    );
  })
  .catch((err) => console.error("Database connection error:", err));

// Configuration CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000", // Frontend local
        "http://localhost:3002", // Port alternatif pour le frontend local
        "https://www.flex-fi.io", // Frontend en production
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Autorise l'origine
      } else {
        callback(new Error("Not allowed by CORS")); // Bloque l'origine
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // Méthodes autorisées
    credentials: true, // Autorise l'envoi de cookies et headers avec authentification
  })
);

app.options("*", cors()); // Répond aux requêtes OPTIONS

// Routes
const authRoutes = require("./router/authRoutes");
const proRoutes = require("./router/proRoutes");
const solanaRoutes = require("./router/solanaRoutes");
const bnplRoutes = require("./router/bnplRoutes");
const kycRoutes = require("./router/kycRoutes");

app.use("/auth", authRoutes);
app.use("/pro", proRoutes);
app.use("/solana", solanaRoutes);
app.use("/bnpl", bnplRoutes);
app.use("/kyc", kycRoutes);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
