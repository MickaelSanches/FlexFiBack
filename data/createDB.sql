-- Supprime la table 'users' si elle existe
DROP TABLE IF EXISTS users;

-- Création de la table 'users'
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    seed_phrase TEXT NOT NULL,
    public_key TEXT,  -- Clé publique du wallet Solana
    private_key TEXT, -- Clé privée du wallet Solana (à sécuriser)
    kyc_status VARCHAR(20) DEFAULT 'pending', -- Statut KYC de l'utilisateur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supprime la table 'email_verification' si elle existe
DROP TABLE IF EXISTS email_verification;

-- Création de la table 'email_verification'
CREATE TABLE email_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Supprime la table 'business_info' si elle existe
DROP TABLE IF EXISTS business_info;

-- Création de la table 'business_info'
CREATE TABLE business_info (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
    siren VARCHAR(20) UNIQUE NOT NULL,
    categorie_juridique VARCHAR(100),
    activite_principale VARCHAR(100),
    denomination VARCHAR(255),
    date_creation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table 'flexfi' pour suivre les encaissements et la balance de l'entreprise --
CREATE TABLE flexfi (
    id SERIAL PRIMARY KEY,
    public_key VARCHAR(255) NOT NULL,
    private_key TEXT NOT NULL,
    total_received DECIMAL(18, 9) DEFAULT 0, -- Stocker les fonds reçus via les frais
    total_fees DECIMAL(18, 9) DEFAULT 0, -- Stocker le total des frais encaissés
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
