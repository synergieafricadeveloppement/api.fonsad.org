// backend/services/departement.service.js

const Departement = require('../models/national/Departement');
const Province = require('../models/national/Province');
const Cellule = require('../models/national/Cellule');
const NationalSettings = require('../models/national/NationalSettings');
const AppError = require('../utils/AppError');

async function getOrCreateSettings() {
  let settings = await NationalSettings.findOne({ scope: 'national' });

  if (!settings) {
    settings = await NationalSettings.create({ scope: 'national' });
  }

  return settings;
}

async function assertCanManageDepartements() {
  const settings = await getOrCreateSettings();

  const allowed =
    settings?.structure?.provincesEnabled === true &&
    settings?.structure?.cellulesEnabled === true &&
    settings?.structure?.departementsEnabled === true &&
    settings?.routes?.provincesRouteEnabled === true &&
    settings?.routes?.cellulesRouteEnabled === true &&
    settings?.routes?.departementsRouteEnabled === true;

  if (!allowed) {
    throw new AppError('La gestion des départements est bloquée par les settings.', 403);
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

  const data = {
    provinceId,
    celluleId,
    name: String(payload.name).trim(),
    code: payload.code ? String(payload.code).trim().toUpperCase() : undefined,
    type: payload.type ? String(payload.type).trim() : undefined,
    description: payload.description ? String(payload.description).trim() : undefined,
    status: payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdBy: userId ? String(userId) : undefined,
    updatedBy: userId ? String(userId) : undefined,
  };

  if (payload.responsable && typeof payload.responsable === 'object') {
    const r = payload.responsable;
    if (r.fullName || r.name) {
      data.responsable = {
        fullName: String(r.fullName ?? r.name ?? '').trim(),
        fonction: String(r.fonction ?? `Chef du département`).trim(),
        phone: r.phone ? String(r.phone).trim() : undefined,
        email: r.email ? String(r.email).trim().toLowerCase() : undefined,
        photoUrl: r.photoUrl ? String(r.photoUrl).trim() : undefined,
      };
    }
  }

  if (Array.isArray(payload.membres)) {
    data.membres = payload.membres
      .filter((m) => m && (m.fullName || m.name))
      .map((m) => ({
        fullName: String(m.fullName ?? m.name ?? '').trim(),
        fonction: m.fonction ? String(m.fonction).trim() : 'Membre',
        phone: m.phone ? String(m.phone).trim() : undefined,
        email: m.email ? String(m.email).trim().toLowerCase() : undefined,
        photoUrl: m.photoUrl ? String(m.photoUrl).trim() : undefined,
      }));
  }

  const departement = await Departement.create(data);
  return departement.toJSON();
}

async function getDepartementById(departementId) {
  await assertCanManageDepartements();

  const departement = await Departement.findById(departementId).lean();
  if (!departement) {
    throw new AppError('Département introuvable.', 404);
  }

  return departement;
}

module.exports = {
  listDepartementsByCellule,
  createDepartement,
  getDepartementById,
};