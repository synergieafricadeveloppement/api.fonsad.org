// backend/utils/AppError.js

// Classe d’erreur personnalisée pour porter un status HTTP.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    // On appelle le constructeur parent Error.
    super(message);

    // On stocke le status HTTP.
    this.statusCode = statusCode;

    // Permet d’identifier cette erreur comme erreur opérationnelle.
    this.isOperational = true;

    // Capture de stack plus propre.
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export.
module.exports = AppError;