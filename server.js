// server.js

/**
 * =========================================================
 * FONSAD BACKEND SERVER
 * =========================================================
 * Ce fichier est l’unique point d’entrée du backend.
 *
 * Il gère :
 * - le chargement des variables d’environnement
 * - la connexion à MongoDB
 * - l’initialisation d’Express
 * - les middlewares globaux
 * - le montage des routes
 * - la gestion des routes introuvables
 * - la gestion centralisée des erreurs
 * - le démarrage du serveur HTTP
 * =========================================================
 */

/**
 * ---------------------------------------------------------
 * IMPORTS PACKAGES
 * ---------------------------------------------------------
 */

// Framework HTTP principal.
const express = require('express');

// Middleware pour gérer CORS.
const cors = require('cors');

// Chargement des variables d’environnement.
const dotenv = require('dotenv');

/**
 * ---------------------------------------------------------
 * IMPORTS INTERNES
 * ---------------------------------------------------------
 */

// Fonction de connexion MongoDB.
const connectDB = require('./config/db');

// Routes d’authentification.
const authRoutes = require('./routes/authRoutes');

// Routes des adhésions / memberships.
const membershipRoutes = require('./routes/membershipRoutes');

// Routes des settings nationaux.
const nationalSettingsRoutes = require('./routes/national/nationalSettings.routes');

// Routes dashboard national.
const nationalDashboardRoutes = require('./routes/national/nationalDashboard.routes');
const nationalProvinceRoutes = require('./routes/national/province.routes');

const nationalDepartementGlobalRoutes = require('./routes/national/departement.global.routes');

// Middleware global de gestion des erreurs.
const errorHandler = require('./middlewares/errorHandler');

/**
 * ---------------------------------------------------------
 * CHARGEMENT DU FICHIER .env
 * ---------------------------------------------------------
 */

// On charge les variables d’environnement avant de les utiliser.
dotenv.config();

/**
 * ---------------------------------------------------------
 * CONSTANTES GLOBALES
 * ---------------------------------------------------------
 */

// Port applicatif.
const PORT = process.env.PORT || 5000;

// Environnement courant.
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * ---------------------------------------------------------
 * INITIALISATION EXPRESS
 * ---------------------------------------------------------
 */

// Création de l’application Express.
const app = express();

/**
 * ---------------------------------------------------------
 * CONFIGURATION CORS
 * ---------------------------------------------------------
 * On prévoit une configuration simple mais extensible.
 * - Si CORS_ORIGIN n’est pas défini, on autorise tout.
 * - Si CORS_ORIGIN est défini, on accepte une liste séparée par virgules.
 * - Les requêtes sans origin (Postman, curl, app mobile) sont acceptées.
 */

const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les appels sans origin explicite.
    if (!origin) {
      return callback(null, true);
    }

    // Si aucune whitelist n’est définie, on autorise tout.
    if (!process.env.CORS_ORIGIN) {
      return callback(null, true);
    }

    // On lit les origins autorisées depuis l’env.
    const allowedOrigins = process.env.CORS_ORIGIN.split(',').map((item) =>
      item.trim()
    );

    // Si l’origin est dans la whitelist, on autorise.
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Sinon on bloque.
    return callback(new Error('Origine non autorisée par CORS.'));
  },

  // Autorise les cookies/headers d’auth si besoin futur.
  credentials: true,
};

/**
 * ---------------------------------------------------------
 * CONNEXION À LA BASE DE DONNÉES
 * ---------------------------------------------------------
 * On lance la connexion dès le démarrage.
 * Si connectDB échoue et throw, le catch du bootstrap arrêtera l’app.
 */

/**
 * ---------------------------------------------------------
 * MIDDLEWARES GLOBAUX
 * ---------------------------------------------------------
 */

// Active CORS.
app.use(cors(corsOptions));

// Parse du JSON avec limite.
app.use(express.json({ limit: '2mb' }));

// Parse des formulaires URL-encoded.
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/**
 * ---------------------------------------------------------
 * ROUTES TECHNIQUES / HEALTHCHECK
 * ---------------------------------------------------------
 */

// Route racine.
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'FONSAD API running',
    environment: NODE_ENV,
  });
});

// Route de santé utile pour monitoring et diagnostic.
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'FONSAD API healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * ---------------------------------------------------------
 * ROUTES MÉTIERS
 * ---------------------------------------------------------
 */

// Auth.
app.use('/api/auth', authRoutes);

// Memberships / adhésions.
app.use('/api/memberships', membershipRoutes);

// Settings nationaux.
app.use('/api/national/settings', nationalSettingsRoutes);
app.use('/api/national/dashboard', nationalDashboardRoutes);
app.use('/api/national/provinces', nationalProvinceRoutes);
app.use('/api/national/departements', nationalDepartementGlobalRoutes);



/**
 * ---------------------------------------------------------
 * 404 - ROUTE INTROUVABLE
 * ---------------------------------------------------------
 * Ce middleware doit venir après toutes les routes applicatives.
 */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route introuvable.',
    path: req.originalUrl,
    method: req.method,
  });
});

/**
 * ---------------------------------------------------------
 * GESTION GLOBALE DES ERREURS
 * ---------------------------------------------------------
 * Toujours à la fin, après routes + 404.
 */

app.use(errorHandler);

/**
 * ---------------------------------------------------------
 * BOOTSTRAP SERVEUR
 * ---------------------------------------------------------
 * On démarre l’application dans une fonction async pour :
 * - attendre proprement MongoDB
 * - arrêter le process si la connexion échoue
 * - centraliser les logs de démarrage
 */

async function startServer() {
  try {
    // Connexion base de données.
    await connectDB();

    // Lancement HTTP.
    app.listen(PORT, '0.0.0.0', () => {
      console.log('==================================================');
      console.log(`FONSAD backend running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Base URL: http://0.0.0.0:${PORT}`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('==================================================');
    console.error('Erreur au démarrage du backend FONSAD');
    console.error(error);
    console.error('==================================================');

    // On coupe le process si la base ne démarre pas correctement.
    process.exit(1);
  }
}

// Exécution du bootstrap.
startServer();