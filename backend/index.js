const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

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

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.log(err));

// Import des routes d'authentification
const router = require('./app/router.js');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
