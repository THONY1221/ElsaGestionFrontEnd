const { Pool } = require("pg");
require("dotenv").config();

// Configuration de la connexion PostgreSQL vers Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion à Supabase PostgreSQL réussie");

    // Test simple
    const result = await client.query("SELECT NOW()");
    console.log("🕒 Timestamp serveur:", result.rows[0].now);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion à Supabase:", error);
    throw error;
  }
}

// Fonction utilitaire pour adapter les requêtes MySQL vers PostgreSQL
function adaptMySQLToPostgreSQL(query, params = []) {
  // Remplacer les placeholders MySQL (?) par PostgreSQL ($1, $2, etc.)
  let adaptedQuery = query;
  let paramIndex = 1;

  adaptedQuery = adaptedQuery.replace(/\?/g, () => `$${paramIndex++}`);

  // Autres adaptations communes
  adaptedQuery = adaptedQuery.replace(/LIMIT \?/g, `LIMIT $${paramIndex - 1}`);
  adaptedQuery = adaptedQuery.replace(
    /OFFSET \?/g,
    `OFFSET $${paramIndex - 1}`
  );

  return { query: adaptedQuery, params };
}

// Fonction pour exécuter des requêtes
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const adapted = adaptMySQLToPostgreSQL(query, params);
    const result = await client.query(adapted.query, adapted.params);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution de la requête:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  adaptMySQLToPostgreSQL,
};
