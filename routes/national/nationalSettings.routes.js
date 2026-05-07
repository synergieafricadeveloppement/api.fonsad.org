// backend/routes/national/nationalSettings.routes.js

// On crée un routeur Express dédié au module national/settings.
const express = require('express');
const router = express.Router();

// On importe les handlers du controller.
const {
  getNationalSettings,
  updateNationalSettings,
} = require('../../controllers/national/nationalSettings.controller');

// Route de lecture du document unique des settings nationaux.
router.get('/', getNationalSettings);

// Route de mise à jour partielle des settings nationaux.
router.put('/', updateNationalSettings);

// On exporte le router pour l’attacher dans app.js.
module.exports = router;