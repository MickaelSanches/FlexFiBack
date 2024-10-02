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

DROP TABLE IF EXISTS bnpl_schedules;

CREATE TABLE bnpl_schedules (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES bnpl_sales(id),
    month_number INT NOT NULL,
    payment_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    payment_hash VARCHAR(255),  -- Le hash de la transaction une fois payée
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS flexfi;

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

DROP TABLE IF EXISTS bnpl_sales;

-- Création de la table 'bnpl_sales' pour gérer les transactions bnpl --
CREATE TABLE bnpl_sales (
    id SERIAL PRIMARY KEY,
    seller_pubkey VARCHAR(255) NOT NULL,   -- Clé publique du vendeur
    buyer_pubkey VARCHAR(255) NOT NULL,    -- Clé publique de l'acheteur
    amount DECIMAL(10, 2) NOT NULL,        -- Montant total de la vente
    is_bnpl BOOLEAN DEFAULT TRUE,          -- Indique si la vente est BNPL (toujours vrai ici)
    months INT NOT NULL,                   -- Nombre de mensualités (6 ou 12)
    monthly_payment DECIMAL(10, 2) NOT NULL, -- Montant de chaque mensualité
    due_date DATE,                         -- Date d’échéance de la prochaine mensualité
    paid BOOLEAN DEFAULT FALSE,            -- Statut de paiement de la mensualité
    transaction_id VARCHAR(255),           -- ID de la transaction blockchain
    details JSONB,                         -- Informations supplémentaires (comme les frais)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date de création de la transaction
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Date de mise à jour de la transaction
);

-- Modification de la table pour ajuster les décimales afin que les mensualités soient précises et correctes --
ALTER TABLE bnpl_sales 
ALTER COLUMN amount TYPE DECIMAL(18, 6), 
ALTER COLUMN monthly_payment TYPE DECIMAL(18, 6),
ADD COLUMN shopper_fee DECIMAL(10, 2),
ADD COLUMN merchant_fee DECIMAL(10, 2),
ADD COLUMN currency VARCHAR(10) DEFAULT 'SOL';

-- Modification de la table `users` pour inclure le statut KYC
ALTER TABLE users
ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN kyc_verification_date TIMESTAMP,
ADD COLUMN kyc_provider VARCHAR(50);

