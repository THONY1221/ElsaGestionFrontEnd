const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || "https://elsa-gestion-front-end.vercel.app",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes de base
app.get("/", (req, res) => {
  res.json({
    message: "🚀 ElsaGestion Backend API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Import et utilisation des routes (à ajouter selon les besoins)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/companies', require('./routes/companies'));
// app.use('/api/products', require('./routes/products'));
// app.use('/api/orders', require('./routes/orders'));

// Gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Démarrage du serveur uniquement si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 Environnement: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
  });
}

module.exports = app;
