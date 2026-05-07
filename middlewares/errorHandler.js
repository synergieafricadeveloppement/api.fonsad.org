// backend/middlewares/errorHandler.js

// On importe notre format de réponse d’erreur.
const { errorResponse } = require('../utils/apiResponse');

// Middleware Express de gestion centralisée des erreurs.
module.exports = function errorHandler(err, req, res, next) {
  // Status HTTP par défaut.
  let statusCode = err.statusCode || 500;

  // Message par défaut.
  let message = err.message || 'Erreur interne du serveur.';

  // Gestion des erreurs Mongo duplicate key, utile pour le unique sur scope.
  if (err && err.code === 11000) {
    statusCode = 409;
    message = 'Conflit de données: une ressource unique existe déjà.';
  }

  // Gestion simple des erreurs Mongoose de validation.
  if (err && err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Données invalides envoyées au serveur.';
  }

  // Réponse JSON homogène.
  return res.status(statusCode).json(
    errorResponse(message, {
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })
  );
};