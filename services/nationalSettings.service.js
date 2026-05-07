// backend/services/nationalSettings.service.js

// On importe le modèle MongoDB.
const NationalSettings = require('../models/national/NationalSettings');

// On importe une erreur HTTP custom pour remonter des erreurs propres.
const AppError = require('../utils/AppError');

// On importe l’utilitaire qui filtre les champs autorisés.
const pickAllowedFields = require('../utils/pickAllowedFields');

// Payload par défaut utilisé si aucun document national n’existe encore.
const DEFAULT_SETTINGS_PAYLOAD = {
  scope: 'national',
  structure: {
    provincesEnabled: false,
    cellulesEnabled: false,
    departementsEnabled: false,
    membersEnabled: false,
    adhesionsEnabled: false,
  },
  modules: {
    rh: false,
    finances: false,
    formations: false,
    membres: false,
    adhesions: false,
  },
  governance: {
    requireValidationForAdhesion: false,
    lockFinanceActionsWithoutApproval: false,
    allowProvinceCreation: false,
  },
  routes: {
    provincesRouteEnabled: false,
    settingsRouteEnabled: true,
    membresRouteEnabled: false,
    adhesionsRouteEnabled: false,
    departementsRouteEnabled: false,
    cellulesRouteEnabled: false,
  },
};

// Définition très stricte des clés qu’on autorise à mettre à jour.
const ALLOWED_UPDATE_SHAPE = {
  structure: [
    'provincesEnabled',
    'cellulesEnabled',
    'departementsEnabled',
    'membersEnabled',
    'adhesionsEnabled',
  ],
  modules: ['rh', 'finances', 'formations', 'membres', 'adhesions'],
  governance: [
    'requireValidationForAdhesion',
    'lockFinanceActionsWithoutApproval',
    'allowProvinceCreation',
  ],
  routes: [
    'provincesRouteEnabled',
    'settingsRouteEnabled',
    'membresRouteEnabled',
    'adhesionsRouteEnabled',
    'departementsRouteEnabled',
    'cellulesRouteEnabled',
  ],
};

// Fonction interne qui récupère ou crée le document unique national.
async function getOrCreateNationalSettings() {
  // On cherche le document singleton.
  let settings = await NationalSettings.findOne({ scope: 'national' });

  // S’il n’existe pas encore, on le crée avec les valeurs par défaut.
  if (!settings) {
    settings = await NationalSettings.create(DEFAULT_SETTINGS_PAYLOAD);
  }

  // On renvoie le document existant ou nouvellement créé.
  return settings;
}

// Lecture des settings nationaux.
async function getSettings() {
  // On garantit qu’un document existe toujours.
  const settings = await getOrCreateNationalSettings();

  // On renvoie le document brut.
  return settings;
}

// Validation métier simple du payload.
function validateSettingsPayload(payload) {
  // Si payload absent, on rejette proprement.
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('Payload de mise à jour invalide.', 400);
  }

  // On vérifie qu’au moins une section connue est présente.
  const allowedTopLevelKeys = ['structure', 'modules', 'governance', 'routes'];
  const incomingKeys = Object.keys(payload);
  const hasAtLeastOneKnownSection = incomingKeys.some((key) =>
    allowedTopLevelKeys.includes(key)
  );

  if (!hasAtLeastOneKnownSection) {
    throw new AppError(
      'Aucune section valide à mettre à jour. Sections autorisées: structure, modules, governance, routes.',
      400
    );
  }
}

// Mise à jour partielle des settings nationaux.
async function updateSettings(payload) {
  // On valide le payload avant tout traitement.
  validateSettingsPayload(payload);

  // On récupère le document national existant.
  const currentSettings = await getOrCreateNationalSettings();

  // On filtre strictement les données autorisées pour chaque bloc.
  const safeStructure = pickAllowedFields(
    payload.structure || {},
    ALLOWED_UPDATE_SHAPE.structure
  );

  const safeModules = pickAllowedFields(
    payload.modules || {},
    ALLOWED_UPDATE_SHAPE.modules
  );

  const safeGovernance = pickAllowedFields(
    payload.governance || {},
    ALLOWED_UPDATE_SHAPE.governance
  );

  const safeRoutes = pickAllowedFields(
    payload.routes || {},
    ALLOWED_UPDATE_SHAPE.routes
  );

  // On merge proprement les données structure.
  currentSettings.structure = {
    ...currentSettings.structure.toObject(),
    ...safeStructure,
  };

  // On merge proprement les données modules.
  currentSettings.modules = {
    ...currentSettings.modules.toObject(),
    ...safeModules,
  };

  // On merge proprement les données gouvernance.
  currentSettings.governance = {
    ...currentSettings.governance.toObject(),
    ...safeGovernance,
  };

  // On merge proprement les données routes.
  currentSettings.routes = {
    ...currentSettings.routes.toObject(),
    ...safeRoutes,
  };

  // On sauvegarde en base.
  await currentSettings.save();

  // On renvoie la version fraîchement persistée.
  return currentSettings;
}

// On exporte les fonctions du service.
module.exports = {
  getSettings,
  updateSettings,
};