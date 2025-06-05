// start.js - Point d'entrée pour le déploiement
const { testConnection } = require("./config/db-supabase");

async function startServer() {
  try {
    console.log("🚀 Démarrage du serveur E_Gestion...");

    // Tester la connexion à Supabase
    await testConnection();

    // Lancer l'application principale
    require("./app");
  } catch (error) {
    console.error("❌ Erreur lors du démarrage:", error);
    process.exit(1);
  }
}

startServer();
