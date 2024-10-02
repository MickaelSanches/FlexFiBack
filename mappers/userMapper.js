const pool = require("../db.js");

class UserMapper {
  async findUserByEmail(email) {
    const result = await pool.query(
      `SELECT u.*, b.*
       FROM users u
       LEFT JOIN business_info b ON u.id = b.user_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  }

  async createUser(email, hashedPassword, seedPhrase, publicKey, privateKey) {
    const result = await pool.query(
      `INSERT INTO users (email, password, seed_phrase, public_key, private_key) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [email, hashedPassword, seedPhrase, publicKey, privateKey]
    );
    return result.rows[0];
  }

  async insertBusinessInfo(userId, businessInfo) {
    const {
      siren,
      categorie_juridique,
      activite_principale,
      denomination,
      date_creation,
    } = businessInfo;
    await db.query(
      `INSERT INTO business_info (user_id, siren, categorie_juridique, activite_principale, denomination, date_creation) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        siren,
        categorie_juridique,
        activite_principale,
        denomination,
        date_creation,
      ]
    );
  }

  async insertVerificationCode(email, code, expiresAt) {
    await pool.query(
      "INSERT INTO email_verification (email, code, expires_at) VALUES ($1, $2, $3)",
      [email, code, expiresAt]
    );
  }

  async updateUserPassword(email, hashedPassword) {
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2 RETURNING *",
      [hashedPassword, email]
    );
    return result.rows[0];
  }

  async findVerificationCode(email, code) {
    const result = await pool.query(
      "SELECT * FROM email_verification WHERE email = $1 AND code = $2 AND expires_at > NOW()",
      [email, code]
    );
    return result.rows[0];
  }

  async getSeedPhrasebyEmail(email, password) {
    const result = await pool.query(
      `SELECT seed_phrase FROM users WHERE email = $1 AND password = $2`,
      [email, password]
    );
    return result.rows[0];
  }
}

module.exports = new UserMapper();
