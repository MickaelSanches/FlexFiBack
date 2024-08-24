const express = require('express');
const dotenv = require('dotenv');
const pool = require('./db.js');

dotenv.config();

const app = express();
app.use(express.json());

// Vérifier la connexion à PostgreSQL
pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.log(err));

// Import des routes d'authentification
const authRoutes = require('./router/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
