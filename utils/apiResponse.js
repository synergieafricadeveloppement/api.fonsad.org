// backend/utils/apiResponse.js

// Réponse de succès standard.
function successResponse(message, data = {}) {
  return {
    success: true,
    message,
    data,
  };
}

// Réponse d’échec standard.
function errorResponse(message, data = {}) {
  return {
    success: false,
    message,
    data,
  };
}

// Exports.
module.exports = {
  successResponse,
  errorResponse,
};