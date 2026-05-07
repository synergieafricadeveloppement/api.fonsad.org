// backend/middlewares/asyncHandler.js

// Middleware utilitaire pour attraper automatiquement les erreurs async.
module.exports = function asyncHandler(fn) {
  // On renvoie un middleware Express standard.
  return function wrappedAsyncHandler(req, res, next) {
    // Toute promesse rejetée sera transmise au errorHandler.
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};