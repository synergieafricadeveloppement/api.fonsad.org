// backend/controllers/national/nationalSettings.controller.js

// On importe l’async handler pour éviter de répéter des try/catch partout.
const asyncHandler = require('../../middlewares/asyncHandler');

// On importe le service métier.
const nationalSettingsService = require('../../services/nationalSettings.service');

// On importe l’utilitaire de réponse standard.
const { successResponse } = require('../../utils/apiResponse');

// Contrôleur GET /api/national/settings
const getNationalSettings = asyncHandler(async (req, res) => {
  // On délègue la récupération au service.
  const settings = await nationalSettingsService.getSettings();

  // On renvoie une réponse API standardisée.
  return res.status(200).json(
    successResponse('Settings nationaux récupérés avec succès.', {
      settings,
    })
  );
});

// Contrôleur PUT /api/national/settings
const updateNationalSettings = asyncHandler(async (req, res) => {
  // On délègue la mise à jour au service.
  const settings = await nationalSettingsService.updateSettings(req.body);

  // On renvoie la ressource mise à jour.
  return res.status(200).json(
    successResponse('Settings nationaux mis à jour avec succès.', {
      settings,
    })
  );
});

// On exporte les contrôleurs.
module.exports = {
  getNationalSettings,
  updateNationalSettings,
};