CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    seed_phrase TEXT NOT NULL,
    kyc_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE business_info (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    siren VARCHAR(20) UNIQUE NOT NULL,
    categorie_juridique VARCHAR(100),
    activite_principale VARCHAR(100),
    denomination VARCHAR(255),
    date_creation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
