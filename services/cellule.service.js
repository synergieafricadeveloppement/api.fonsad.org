// backend/services/cellule.service.js

const mongoose = require('mongoose');

const Cellule = require('../models/national/Cellule');
const Province = require('../models/national/Province');
const Departement = require('../models/national/Departement');
const Membre = require('../models/national/Membre');
const Tache = require('../models/national/Tache');
const Formation = require('../models/national/Formation');
const Finance = require('../models/national/Finance');
const Adhesion = require('../models/national/Adhesion');
const NationalSettings = require('../models/national/NationalSettings');
const AppError = require('../utils/AppError');

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

function buildResponsablePayload(raw, { partial = false } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;

  const responsable = {
    fullName: normalizeString(raw.fullName || raw.name),
    fonction:
      normalizeString(raw.fonction || raw.role) || 'Responsable cellule',
    phone: normalizeString(raw.phone),
    email: normalizeString(raw.email, { lowercase: true }),
    photoUrl: normalizeString(raw.photoUrl),
  };

  if (partial) {
    const hasAnyField = Object.values(responsable).some(
      (value) => value !== undefined
    );
    return hasAnyField ? responsable : undefined;
  }

  if (!responsable.fullName) return undefined;
  return responsable;
}

function readBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

async function getOrCreateSettings() {
  let settings = await NationalSettings.findOne({ scope: 'national' });

  if (!settings) {
    settings = await NationalSettings.create({
      scope: 'national',
      structure: {
        provincesEnabled: true,
        cellulesEnabled: true,
      },
      routes: {
        provincesRouteEnabled: true,
        cellulesRouteEnabled: true,
      },
      governance: {
        allowCelluleRead: true,
        allowCelluleCreation: true,
        allowCelluleUpdate: true,
        allowCelluleDeletion: true,
      },
    });

    console.log(
      '[cellule.service.getOrCreateSettings] settings créés par défaut =',
      settings
    );
  } else {
    console.log(
      '[cellule.service.getOrCreateSettings] settings existants chargés =',
      settings
    );
  }

  return settings;
}

/**
 * Logique simplifiée, alignée sur province.service
 * - baseReadAllowed = structure + route + provinces
 * - allowCelluleCreation fallback = même base
 * - governance.* peut toujours surcharger explicitement
 */
function buildNormalizedPermissions(settings) {
  const structure = settings?.structure || {};
  const routes = settings?.routes || {};
  const governance = settings?.governance || {};

  const provincesEnabled = readBoolean(structure.provincesEnabled, true);
  const cellulesEnabled = readBoolean(structure.cellulesEnabled, true);
  const provincesRouteEnabled = readBoolean(
    routes.provincesRouteEnabled,
    true
  );
  const cellulesRouteEnabled = readBoolean(routes.cellulesRouteEnabled, true);

  const baseReadAllowed =
    provincesEnabled === true &&
    cellulesEnabled === true &&
    provincesRouteEnabled === true;

  const allowCelluleRead = readBoolean(
    governance.allowCelluleRead,
    baseReadAllowed
  );
  const allowCelluleCreation = readBoolean(
    governance.allowCelluleCreation,
    baseReadAllowed
  );
  const allowCelluleUpdate = readBoolean(
    governance.allowCelluleUpdate,
    baseReadAllowed
  );
  const allowCelluleDeletion = readBoolean(
    governance.allowCelluleDeletion,
    baseReadAllowed
  );

  const permissions = {
    provincesEnabled,
    cellulesEnabled,
    provincesRouteEnabled,
    cellulesRouteEnabled,
    allowCelluleRead,
    allowCelluleCreation,
    allowCelluleUpdate,
    allowCelluleDeletion,
  };

  console.log(
    '[cellule.service.buildNormalizedPermissions] =',
    JSON.stringify(permissions)
  );

  return permissions;
}

async function assertProvinceExists(provinceId) {
  if (!isStrictObjectId(String(provinceId))) {
    throw new AppError('Identifiant de province invalide.', 400);
  }

  const province = await Province.findById(provinceId).lean();
  if (!province) {
    throw new AppError('Province introuvable.', 404);
  }

  return province;
}

async function assertCanReadCellules() {
  const settings = await getOrCreateSettings();
  const permissions = buildNormalizedPermissions(settings);

  if (permissions.allowCelluleRead !== true) {
    throw new AppError(
      'La consultation des cellules est bloquée par les settings.',
      403
    );
  }

  return { settings, permissions };
}

async function assertCanCreateCellules() {
  const settings = await getOrCreateSettings();
  const permissions = buildNormalizedPermissions(settings);

  if (permissions.allowCelluleCreation !== true) {
    throw new AppError(
      'La création des cellules est actuellement désactivée par les settings nationaux.',
      403
    );
  }

  return { settings, permissions };
}

async function assertCanUpdateCellules() {
  const settings = await getOrCreateSettings();
  const permissions = buildNormalizedPermissions(settings);

  if (permissions.allowCelluleUpdate !== true) {
    throw new AppError(
      'La modification des cellules est bloquée par les settings.',
      403
    );
  }

  return { settings, permissions };
}

async function assertCanDeleteCellules() {
  const settings = await getOrCreateSettings();
  const permissions = buildNormalizedPermissions(settings);

  if (permissions.allowCelluleDeletion !== true) {
    throw new AppError(
      'La suppression des cellules est bloquée par les settings.',
      403
    );
  }

  return { settings, permissions };
}

async function assertCanManageCellules() {
  const settings = await getOrCreateSettings();
  const permissions = buildNormalizedPermissions(settings);

  const allowed =
    permissions.allowCelluleRead === true &&
    permissions.allowCelluleCreation === true &&
    permissions.allowCelluleUpdate === true &&
    permissions.allowCelluleDeletion === true;

  if (!allowed) {
    throw new AppError(
      'La gestion des cellules est bloquée par les settings.',
      403
    );
  }

  return { settings, permissions };
}

async function assertCelluleBelongsToProvince(provinceId, celluleId) {
  if (!isStrictObjectId(String(celluleId))) {
    throw new AppError('Identifiant de cellule invalide.', 400);
  }

  const cellule = await Cellule.findOne({
    _id: celluleId,
    provinceId,
  }).lean();

  if (!cellule) {
    throw new AppError('Cellule introuvable pour cette province.', 404);
  }

  return cellule;
}

function buildCelluleCreatePayload(provinceId, payload, userId) {
  const name = normalizeString(payload?.name);
  if (!name) {
    throw new AppError('Le nom de la cellule est obligatoire.', 400);
  }

  const data = {
    provinceId,
    name,
    code: normalizeString(payload?.code, { uppercase: true }),
    type: normalizeString(payload?.type, { uppercase: true }) || 'COMMUNE',
    commune: normalizeString(payload?.commune),
    zone: normalizeString(payload?.zone),
    address: normalizeString(payload?.address),
    phone: normalizeString(payload?.phone),
    email: normalizeString(payload?.email, { lowercase: true }),
    description: normalizeString(payload?.description),
    status: normalizeString(payload?.status, { uppercase: true }) || 'ACTIVE',
    createdBy: normalizeString(userId),
    updatedBy: normalizeString(userId),
  };

  const responsable = buildResponsablePayload(payload?.responsable);
  if (responsable) {
    data.responsable = responsable;
  }

  return data;
}

function buildCelluleUpdatePayload(payload, userId, { isPartial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('Payload de mise à jour invalide.', 400);
  }

  const updateData = {};

  const assignIfDefined = (key, value) => {
    if (value !== undefined) updateData[key] = value;
  };

  if (!isPartial || payload.name !== undefined) {
    const name = normalizeString(payload.name);
    if (!isPartial && !name) {
      throw new AppError('Le nom de la cellule est obligatoire.', 400);
    }
    assignIfDefined('name', name);
  }

  if (!isPartial || payload.code !== undefined) {
    assignIfDefined(
      'code',
      normalizeString(payload.code, { uppercase: true })
    );
  }

  if (!isPartial || payload.type !== undefined) {
    assignIfDefined(
      'type',
      normalizeString(payload.type, { uppercase: true })
    );
  }

  if (!isPartial || payload.status !== undefined) {
    assignIfDefined(
      'status',
      normalizeString(payload.status, { uppercase: true })
    );
  }

  if (!isPartial || payload.commune !== undefined) {
    assignIfDefined('commune', normalizeString(payload.commune));
  }

  if (!isPartial || payload.zone !== undefined) {
    assignIfDefined('zone', normalizeString(payload.zone));
  }

  if (!isPartial || payload.address !== undefined) {
    assignIfDefined('address', normalizeString(payload.address));
  }

  if (!isPartial || payload.phone !== undefined) {
    assignIfDefined('phone', normalizeString(payload.phone));
  }

  if (!isPartial || payload.email !== undefined) {
    assignIfDefined('email', normalizeString(payload.email, { lowercase: true }));
  }

  if (!isPartial || payload.description !== undefined) {
    assignIfDefined('description', normalizeString(payload.description));
  }

  if (payload.responsable !== undefined) {
    const responsable = buildResponsablePayload(payload.responsable, {
      partial: isPartial,
    });
    if (responsable) {
      updateData.responsable = responsable;
    }
  }

  assignIfDefined('updatedBy', normalizeString(userId));

  return updateData;
}

async function listCellulesByProvince(provinceId) {
  const province = await assertProvinceExists(provinceId);
  const { permissions } = await assertCanReadCellules();

  const cellules = await Cellule.find({ provinceId })
    .sort({ name: 1 })
    .lean();

  return {
    province: {
      id: String(province.id),
      name: province.name,
      code: province.code || undefined,
      chefLieu: province.chefLieu || undefined,
    },
    cellules,
    governance: {
      allowCelluleRead: permissions.allowCelluleRead,
      allowCelluleCreation: permissions.allowCelluleCreation,
      allowCelluleUpdate: permissions.allowCelluleUpdate,
      allowCelluleDeletion: permissions.allowCelluleDeletion,
    },
  };
}

async function createCellule(provinceId, payload, userId) {
  await assertCanCreateCellules();
  await assertProvinceExists(provinceId);

  const data = buildCelluleCreatePayload(provinceId, payload, userId);

  if (data.code) {
    const existing = await Cellule.findOne({
      provinceId,
      code: data.code,
    }).lean();

    if (existing) {
      throw new AppError(
        'Une cellule avec ce code existe déjà dans cette province.',
        409
      );
    }
  }

  const cellule = await Cellule.create(data);
  return cellule.toJSON();
}

async function getCelluleById(provinceId, celluleId) {
  await assertCanReadCellules();
  await assertProvinceExists(provinceId);
  return assertCelluleBelongsToProvince(provinceId, celluleId);
}

async function updateCellule(provinceId, celluleId, payload, userId, { isPartial = false } = {}) {
  await assertCanUpdateCellules();
  await assertProvinceExists(provinceId);

  const existingCellule = await assertCelluleBelongsToProvince(
    provinceId,
    celluleId
  );

  const updateData = buildCelluleUpdatePayload(payload, userId, { isPartial });

  const nextCode =
    updateData.code !== undefined ? updateData.code : existingCellule.code;

  if (nextCode) {
    const duplicate = await Cellule.findOne({
      provinceId,
      code: nextCode,
      _id: { $ne: celluleId },
    }).lean();

    if (duplicate) {
      throw new AppError(
        'Une autre cellule utilise déjà ce code dans cette province.',
        409
      );
    }
  }

  const cellule = await Cellule.findOneAndUpdate(
    { _id: celluleId, provinceId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!cellule) {
    throw new AppError('Cellule introuvable.', 404);
  }

  return cellule.toJSON();
}

async function deleteCellule(provinceId, celluleId) {
  await assertCanDeleteCellules();
  await assertProvinceExists(provinceId);

  const cellule = await assertCelluleBelongsToProvince(provinceId, celluleId);

  const departementsCount = await Departement.countDocuments({
    provinceId,
    celluleId,
  });

  if (departementsCount > 0) {
    throw new AppError(
      'Suppression impossible: cette cellule contient encore des départements.',
      409
    );
  }

  await Cellule.deleteOne({ _id: celluleId, provinceId });
  return cellule;
}

/**
 * Lecture seule nationale:
 * calcule les compteurs métier pour la cellule à partir des collections
 * Departement, Membre, Tache, Formation, Finance, Adhesion.
 */
async function getCelluleByIdWithStats(provinceId, celluleId) {
  if (!mongoose.isValidObjectId(provinceId)) {
    throw new AppError('Identifiant de province invalide.', 400);
  }

  if (!mongoose.isValidObjectId(celluleId)) {
    throw new AppError('Identifiant de cellule invalide.', 400);
  }

  const cellule = await Cellule.findOne({
    _id: celluleId,
    provinceId,
  }).lean();

  if (!cellule) {
    throw new AppError('Cellule introuvable.', 404);
  }

  const [
    departementsCount,
    membresCount,
    tachesCount,
    formationsCount,
    financesCount,
    adhesionsCount,
  ] = await Promise.all([
    Departement.countDocuments({ provinceId, celluleId }),
    Membre.countDocuments({ provinceId, celluleId }),
    Tache.countDocuments({ provinceId, celluleId }),
    Formation.countDocuments({ provinceId, celluleId }),
    Finance.countDocuments({ provinceId, celluleId }),
    Adhesion.countDocuments({ provinceId, celluleId }),
  ]);

  return {
    ...cellule,
    departementsCount,
    membresCount,
    tachesCount,
    formationsCount,
    financesCount,
    adhesionsCount,
  };
}

module.exports = {
  listCellulesByProvince,
  createCellule,
  getCelluleById,
  updateCellule,
  deleteCellule,

  getOrCreateSettings,
  buildNormalizedPermissions,
  assertCanReadCellules,
  assertCanCreateCellules,
  assertCanUpdateCellules,
  assertCanDeleteCellules,
  assertCanManageCellules,

  getCelluleByIdWithStats,
};