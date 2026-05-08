/**
 * =========================================================
 * FONSAD BACKEND SERVER
 * =========================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const nationalSettingsRoutes = require('./routes/national/nationalSettings.routes');
const nationalDashboardRoutes = require('./routes/national/nationalDashboard.routes');
const nationalProvinceRoutes = require('./routes/national/province.routes');
const nationalDepartementGlobalRoutes = require('./routes/national/departement.global.routes');
const nationalCelluleGlobalRoutes = require('./routes/national/cellule.global.routes');
const nationalMembreGlobalRoutes = require('./routes/national/membre.global.routes');
const nationalAdhesionGlobalRoutes = require('./routes/national/adhesion.global.routes');
const nationalFinanceGlobalRoutes = require('./routes/national/finance.global.routes');

const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

/**
 * CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!process.env.CORS_ORIGIN) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.CORS_ORIGIN.split(',').map((item) =>
      item.trim()
    );

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origine non autorisée par CORS.'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

/**
 * Parsers
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Fichiers statiques uploads
 * /uploads/responsables/xxx.ext
 */
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    fallthrough: false,
    maxAge: '7d',
    etag: true,
    lastModified: true,
  })
);

/**
 * Routes techniques
 */

// Root
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'FONSAD API running',
    environment: NODE_ENV,
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'FONSAD API healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Debug accès uploads
app.get('/debug/uploads-exists', (req, res) => {
  const base =
    process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
  return res.status(200).json({
    success: true,
    uploadsUrlExample: `${base}/uploads/responsables/example.jpg`,
  });
});

/**
 * Routes métiers
 */
app.use('/api/auth', authRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/national/settings', nationalSettingsRoutes);
app.use('/api/national/dashboard', nationalDashboardRoutes);
app.use('/api/national/provinces', nationalProvinceRoutes);
app.use('/api/national/departements', nationalDepartementGlobalRoutes);
app.use('/api/national/cellules', nationalCelluleGlobalRoutes);
app.use('/api/national/membres', nationalMembreGlobalRoutes);
app.use('/api/national/adhesions', nationalAdhesionGlobalRoutes);
app.use('/api/national/finances', nationalFinanceGlobalRoutes);

/**
 * 404
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
 * Gestion globale des erreurs
 *
 * On laisse ton errorHandler existant gérer AppError & co,
 * et on ajoute la gestion spécifique Multer si besoin.
 */
app.use((err, req, res, next) => {
  // Multer
  if (err && err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur upload fichier.',
    });
  }

  // Délégué à ton middleware global
  return errorHandler(err, req, res, next);
});

/**
 * Bootstrap serveur
 */
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      const baseUrl =
        process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

      console.log('==================================================');
      console.log(`FONSAD backend running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Public Base URL: ${baseUrl}`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('==================================================');
    console.error('Erreur au démarrage du backend FONSAD');
    console.error(error);
    console.error('==================================================');
    process.exit(1);
  }
}

startServer();