const mongoose = require('mongoose');
const Province = require('../models/national/Province');
const Departement = require('../models/national/Departement');
const NationalSettings = require('../models/national/NationalSettings');
const AppError = require('../utils/AppError');

const DEFAULT_DEPARTEMENTS = [
  {
    name: 'Département d’Administration',
    code: 'ADMIN',
    type: 'ADMINISTRATION',
    description: 'Administration générale, gestion interne, finances et secrétariat.',
  },
  {
    name: 'Département de Communication',
    code: 'COMM',
    type: 'COMMUNICATION',
    description: 'Communication institutionnelle, image et diffusion.',
  },
  {
    name: 'Département de Projet et Entrepreneuriat',
    code: 'ENTR',
    type: 'ENTREPRENEURIAT',
    description: 'Projets, innovation, entrepreneuriat et initiatives locales.',
  },
  {
    name: 'Département de l’Agri, Pêche et Élevage',
    code: 'AGRI',
    type: 'AGRIPECHEELEVAGE',
    description: 'Agriculture, pêche, élevage et production locale.',
  },
  {
    name: 'Département de l’Éducation',
    code: 'EDUC',
    type: 'EDUCATION',
    description: 'Éducation, pédagogie, accompagnement et formation civique.',
  },
  {
    name: 'Département de Psychologie et Social',
    code: 'PSY',
    type: 'PSYCHOSOCIAL',
    description: 'Accompagnement psychosocial et actions sociales.',
  },
  {
    name: 'Département de la Santé',
    code: 'SANTE',
    type: 'SANTE',
    description: 'Santé communautaire, prévention et encadrement sanitaire.',
  },
  {
    name: 'Département de la Formation Professionnelle',
    code: 'FORM',
    type: 'FORMATION_PRO',
    description: 'Formation technique, métiers et professionnalisation.',
  },
  {
    name: 'Département de la Mobilisation et Implantation',
    code: 'MOB',
    type: 'MOBILISATION_IMPLANTATION',
    description: 'Mobilisation, implantation et expansion territoriale.',
  },
  {
    name: 'Département de Genre et Famille',
    code: 'GENRE',
    type: 'GENRE_FAMILLE',
    description: 'Genre, famille, inclusion et accompagnement social.',
  },
];

function isStrictObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
}

function normalizeString(value, { lowercase = false, uppercase = false } = {}) {
  if (value === undefined || value === null) return undefined;
  let output = String(value).trim();
  if (!output) return undefined;
  if (lowercase) output = output.toLowerCase();
  if (uppercase) output = output.toUpperCase();
  return output;
}

function buildResponsablePayload(raw) {
  if (!raw || typeof raw !== 'object') return undefined;

  const responsable = {
    fullName: normalizeString(raw.fullName || raw.name),
    fonction:
      normalizeString(raw.fonction || raw.role) || 'Coordinateur provincial',
    phone: normalizeString(raw.phone),
    email: normalizeString(raw.email, { lowercase: true }),
    photoUrl: normalizeString(raw.photoUrl),
  };

  if (!responsable.fullName) return undefined;
  return responsable;
}

function buildProvincePayload(payload, userId) {
  const data = {
    name: normalizeString(payload.name),
    code: normalizeString(payload.code, { uppercase: true }),
    country: normalizeString(payload.country) || 'RDC',
    chefLieu: normalizeString(payload.chefLieu),
    address: normalizeString(payload.address),
    phone: normalizeString(payload.phone),
    email: normalizeString(payload.email, { lowercase: true }),
    description: normalizeString(payload.description),
    status: payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdBy: normalizeString(userId),
    updatedBy: normalizeString(userId),
  };

  if (!data.name) {
    throw new AppError('Le nom de la province est obligatoire.', 400);
  }

  const responsable = buildResponsablePayload(payload.responsable);
  if (responsable) {
    data.responsable = responsable;
  }

  return data;
}

// Récupère les settings nationaux et garantit qu’un document complet existe.
async function getOrCreateSettings() {
  let settings = await NationalSettings.findOne({ scope: 'national' });

  if (!settings) {
    settings = await NationalSettings.create({
      scope: 'national',
      governance: { allowProvinceCreation: true },
      structure: { provincesEnabled: true },
      routes: { provincesRouteEnabled: true },
    });
  }

  return settings;
}

// Vérifie si la création est autorisée.
async function assertCanCreateProvince() {
  const settings = await getOrCreateSettings();

  const isEnabled =
    settings?.governance?.allowProvinceCreation === true &&
    (settings?.structure?.provincesEnabled ?? true) === true &&
    (settings?.routes?.provincesRouteEnabled ?? true) === true;

  if (!isEnabled) {
    throw new AppError(
      'La création de province est actuellement désactivée dans les paramètres nationaux.',
      403
    );
  }

  return settings;
}

// Liste des provinces + gouvernance.
async function listProvincesWithGovernance() {
  const settings = await getOrCreateSettings();

  const provinces = await Province.find({})
    .sort({ name: 1 })
    .lean()
    .exec();

  const governance = {
    allowProvinceCreation:
      settings?.governance?.allowProvinceCreation === true &&
      (settings?.structure?.provincesEnabled ?? true) === true &&
      (settings?.routes?.provincesRouteEnabled ?? true) === true,
  };

  return { provinces, governance };
}

// Récupère une province par ID.
async function getProvinceById(provinceId) {
  if (!isStrictObjectId(provinceId)) {
    throw new AppError('Identifiant de province invalide.', 400);
  }

  const province = await Province.findById(provinceId).lean().exec();

  if (!province) {
    throw new AppError('Province introuvable.', 404);
  }

  return province;
}

async function createDefaultDepartementsForProvince({
  provinceId,
  celluleId,
  departements = [],
  userId,
}) {
  if (!celluleId) {
    return {
      createdDepartements: [],
      skipped: true,
      reason: 'Aucune cellule cible fournie pour rattacher les départements.',
    };
  }

  if (!isStrictObjectId(String(provinceId))) {
    throw new AppError(
      'Identifiant de province invalide pour bootstrap des départements.',
      400
    );
  }

  if (!isStrictObjectId(String(celluleId))) {
    throw new AppError(
      'Identifiant de cellule invalide pour bootstrap des départements.',
      400
    );
  }

  const sourceDepartements =
    Array.isArray(departements) && departements.length > 0
      ? departements
      : DEFAULT_DEPARTEMENTS;

  const docs = sourceDepartements
    .map((item) => ({
      provinceId,
      celluleId,
      name: normalizeString(item.name),
      code: normalizeString(item.code, { uppercase: true }),
      type: normalizeString(item.type, { uppercase: true }),
      description: normalizeString(item.description),
      status: item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      createdBy: normalizeString(userId),
      updatedBy: normalizeString(userId),
    }))
    .filter((item) => item.name);

  if (docs.length === 0) {
    return {
      createdDepartements: [],
      skipped: true,
      reason: 'Aucun département valide à créer.',
    };
  }

  const createdDepartements = await Departement.insertMany(docs, {
    ordered: true,
  });

  return {
    createdDepartements: createdDepartements.map((doc) => doc.toJSON()),
    skipped: false,
    reason: null,
  };
}

// Crée une nouvelle province.
async function createProvince(payload, options = {}) {
  const { userId } = options;

  // Safety backend : on vérifie à chaque création
  await assertCanCreateProvince();

  const provinceData = buildProvincePayload(payload, userId);
  const province = await Province.create(provinceData);

  const bootstrapStructure = payload?.bootstrapStructure || {};
  let bootstrapResult = {
    createdDepartements: [],
    skipped: true,
    reason: null,
  };

  const shouldGenerateDefaultDepartements =
    bootstrapStructure?.generateDefaultDepartements === true;

  if (shouldGenerateDefaultDepartements) {
    bootstrapResult = await createDefaultDepartementsForProvince({
      provinceId: province._id,
      celluleId: normalizeString(bootstrapStructure.celluleId),
      departements: Array.isArray(bootstrapStructure.departements)
        ? bootstrapStructure.departements
        : DEFAULT_DEPARTEMENTS,
      userId,
    });
  }

  return {
    ...province.toJSON(),
    bootstrap: {
      generateDefaultDepartements: shouldGenerateDefaultDepartements,
      createdDepartementsCount: bootstrapResult.createdDepartements.length,
      createdDepartements: bootstrapResult.createdDepartements,
      skipped: bootstrapResult.skipped,
      reason:
        bootstrapResult.reason ||
        (shouldGenerateDefaultDepartements &&
        bootstrapResult.createdDepartements.length === 0
          ? 'Les départements n’ont pas été créés.'
          : null),
    },
  };
}

module.exports = {
  listProvincesWithGovernance,
  getProvinceById,
  createProvince,
  getOrCreateSettings,
  assertCanCreateProvince,
};