const express = require('express');
const router = express.Router();
const { simulateBNPL } = require('../controllers/bnplController');

// Route pour la simulation BNPL
router.post('/bnpl/simulate', simulateBNPL);

module.exports = router;
