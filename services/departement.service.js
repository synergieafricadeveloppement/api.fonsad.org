// backend/services/departement.service.js

const Departement = require('../models/national/Departement');
const Province = require('../models/national/Province');
const Cellule = require('../models/national/Cellule');
const NationalSettings = require('../models/national/NationalSettings');
const AppError = require('../utils/AppError');

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized.length ? normalized : '';
}

function normalizeEmail(value) {
  const normalized = cleanString(value);
  return normalized ? normalized.toLowerCase() : '';
}

function normalizeResponsable(responsable = {}) {
  return {
    fullName: cleanString(responsable.fullName ?? responsable.name) || '',
    fonction: cleanString(responsable.fonction) || 'Chef du département',
    phone: cleanString(responsable.phone) || '',
    email: normalizeEmail(responsable.email) || '',
    photoUrl: cleanString(responsable.photoUrl) || '',
  };
}

function normalizeMembres(membres = []) {
  if (!Array.isArray(membres)) return [];

  return membres
    .filter((m) => m && (m.fullName || m.name))
    .map((m) => ({
      fullName: cleanString(m.fullName ?? m.name) || '',
      fonction: cleanString(m.fonction) || 'Membre',
      phone: cleanString(m.phone) || '',
      email: normalizeEmail(m.email) || '',
      photoUrl: cleanString(m.photoUrl) || '',
    }));
}

async function getOrCreateSettings() {
  let settings = await NationalSettings.findOne({ scope: 'national' });

  if (!settings) {
    settings = await NationalSettings.create({ scope: 'national' });
  }

  return settings;
}

/**
 * Garde robuste :
 * - si flag absent => on ne bloque pas
 * - si flag explicitement false => on bloque
 */
async function assertCanManageDepartements() {
  const settings = await getOrCreateSettings();

  const blocked =
    settings?.structure?.provincesEnabled === false ||
    settings?.structure?.cellulesEnabled === false ||
    settings?.structure?.departementsEnabled === false ||
    settings?.routes?.provincesRouteEnabled === false ||
    settings?.routes?.cellulesRouteEnabled === false ||
    settings?.routes?.departementsRouteEnabled === false;

  console.log('[departement.service] settings =', {
    structure: settings?.structure,
    routes: settings?.routes,
    blocked,
  });

  if (blocked) {
    throw new AppError(
      'La gestion des départements est bloquée par les settings.',
      403
    );
  }

  return settings;
}

async function assertProvinceAndCellule(provinceId, celluleId) {
  const province = await Province.findById(provinceId).lean();
  if (!province) {
    throw new AppError('Province introuvable.', 404);
  }

  const cellule = await Cellule.findOne({ _id: celluleId, provinceId }).lean();
  if (!cellule) {
    throw new AppError('Cellule introuvable pour cette province.', 404);
  }

  return { province, cellule };
}

async function listDepartementsByCellule(provinceId, celluleId) {
  await assertCanManageDepartements();
  await assertProvinceAndCellule(provinceId, celluleId);

  const departements = await Departement.find({ provinceId, celluleId })
    .sort({ name: 1 })
    .lean();

  return departements;
}

async function createDepartement(provinceId, celluleId, payload, options = {}) {
  const { userId } = options;

  await assertCanManageDepartements();
  await assertProvinceAndCellule(provinceId, celluleId);

  if (!payload?.name || !String(payload.name).trim()) {
    throw new AppError('Le nom du département est obligatoire.', 400);
  }

  const membres = normalizeMembres(payload.membres);
  const responsable = normalizeResponsable(payload.responsable || {});

  const data = {
    provinceId,
    celluleId,
    name: cleanString(payload.name),
    code: cleanString(payload.code)?.toUpperCase() || '',
    type: cleanString(payload.type) || '',
    description: cleanString(payload.description) || '',
    status: cleanString(payload.status)?.toUpperCase() || 'ACTIVE',
    responsable,
    membres,
    membresCount: membres.length,
    createdBy: userId ? String(userId) : '',
    updatedBy: userId ? String(userId) : '',
  };

  const departement = await Departement.create(data);
  return departement.toJSON();
}

async function getDepartementById(provinceId, celluleId, departementId) {
  await assertCanManageDepartements();
  await assertProvinceAndCellule(provinceId, celluleId);

  const departement = await Departement.findOne({
    _id: departementId,
    provinceId,
    celluleId,
  }).lean();

  if (!departement) {
    throw new AppError('Département introuvable.', 404);
  }

  return departement;
}

async function updateDepartement(
  provinceId,
  celluleId,
  departementId,
  payload,
  options = {}
) {
  const { userId, isPartial = false } = options;

  await assertCanManageDepartements();
  await assertProvinceAndCellule(provinceId, celluleId);

  const existing = await Departement.findOne({
    _id: departementId,
    provinceId,
    celluleId,
  });

  if (!existing) {
    throw new AppError('Département introuvable.', 404);
  }

  const updateData = {};

  const apply = (key, value) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  };

  if (!isPartial || payload.name !== undefined) {
    apply('name', cleanString(payload.name));
  }

  if (!isPartial || payload.code !== undefined) {
    apply('code', cleanString(payload.code)?.toUpperCase() || '');
  }

  if (!isPartial || payload.type !== undefined) {
    apply('type', cleanString(payload.type) || '');
  }

  if (!isPartial || payload.status !== undefined) {
    apply('status', cleanString(payload.status)?.toUpperCase() || 'ACTIVE');
  }

  if (!isPartial || payload.description !== undefined) {
    apply('description', cleanString(payload.description) || '');
  }

  if (!isPartial || payload.responsable !== undefined) {
    apply('responsable', normalizeResponsable(payload.responsable || {}));
  }

  if (!isPartial || payload.membres !== undefined) {
    const membres = normalizeMembres(payload.membres || []);
    apply('membres', membres);
    apply('membresCount', membres.length);
  }

  apply('updatedBy', userId ? String(userId) : existing.updatedBy || '');

  const updated = await Departement.findByIdAndUpdate(
    departementId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  return updated;
}

async function deleteDepartement(provinceId, celluleId, departementId) {
  await assertCanManageDepartements();
  await assertProvinceAndCellule(provinceId, celluleId);

  const deleted = await Departement.findOneAndDelete({
    _id: departementId,
    provinceId,
    celluleId,
  }).lean();

  if (!deleted) {
    throw new AppError('Département introuvable.', 404);
  }

  return deleted;
}

module.exports = {
  getOrCreateSettings,
  assertCanManageDepartements,
  listDepartementsByCellule,
  createDepartement,
  getDepartementById,
  updateDepartement,
  deleteDepartement,
};