const { Pool } = require("pg");
require("dotenv").config();

// const isDevelopment = process.env.NODE_ENV !== "production";

// const pool = new Pool({
//   user: isDevelopment ? process.env.DB_USER_DEV : process.env.DB_USER_PROD,
//   host: isDevelopment ? process.env.DB_HOST_DEV : process.env.DB_HOST_PROD,
//   database: isDevelopment ? process.env.DB_NAME_DEV : process.env.DB_NAME_PROD,
//   password: isDevelopment ? process.env.DB_PASS_DEV : "LesYeuxVerslAvenir",
//   port: isDevelopment ? process.env.DB_PORT_DEV : process.env.DB_PORT_PROD,
// });

// pool
//   .connect()
//   .then(() =>
//     console.log(
//       `Connected to PostgreSQL (${
//         isDevelopment ? "Development" : "Production"
//       })`
//     )
//   )
//   .catch((err) => console.error("Database connection error:", err));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: "LesYeuxVerslAvenir",
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.log(err));

module.exports = pool;
