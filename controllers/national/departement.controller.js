// backend/controllers/national/departement.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const departementService = require('../../services/departement.service');

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getUploadedRelativePath(file) {
  if (!file?.filename) return '';
  return `/uploads/departements/${file.filename}`;
}

function normalizeMultipartPayload(req) {
  const responsablePhotoFile = Array.isArray(req.files?.responsablePhoto)
    ? req.files.responsablePhoto[0]
    : null;

  const membresPhotosFiles = Array.isArray(req.files?.membresPhotos)
    ? req.files.membresPhotos
    : [];

  const responsableFromJson = parseJsonField(req.body?.responsable, null);

  const payload = {
    name: req.body?.name,
    code: req.body?.code,
    type: req.body?.type,
    status: req.body?.status,
    description: req.body?.description,
    responsable:
      responsableFromJson || {
        fullName: req.body?.responsableFullName,
        fonction: req.body?.responsableFonction,
        phone: req.body?.responsablePhone,
        email: req.body?.responsableEmail,
        photoUrl: req.body?.responsablePhotoUrl,
      },
    membres: parseJsonField(req.body?.membres, []),
  };

  if (responsablePhotoFile) {
    payload.responsable = {
      ...(payload.responsable || {}),
      photoUrl: getUploadedRelativePath(responsablePhotoFile),
    };
  }

  if (Array.isArray(payload.membres) && payload.membres.length) {
    payload.membres = payload.membres.map((member, index) => {
      const linkedFile = membresPhotosFiles[index];
      if (!linkedFile) return member;

      return {
        ...member,
        photoUrl: getUploadedRelativePath(linkedFile),
      };
    });
  }

  return payload;
}

const getDepartementsByCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  const departements = await departementService.listDepartementsByCellule(
    provinceId,
    celluleId
  );

  return res.status(200).json(
    successResponse('Départements récupérés avec succès.', {
      departements,
    })
  );
});

const createDepartement = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  const payload = normalizeMultipartPayload(req);

  const departement = await departementService.createDepartement(
    provinceId,
    celluleId,
    payload,
    { userId }
  );

  return res.status(201).json(
    successResponse('Département créé avec succès.', {
      departement,
    })
  );
});

const getDepartementDetail = asyncHandler(async (req, res) => {
  const { provinceId, celluleId, departementId } = req.params;

  const departement = await departementService.getDepartementById(
    provinceId,
    celluleId,
    departementId
  );

  return res.status(200).json(
    successResponse('Détail du département récupéré avec succès.', {
      departement,
    })
  );
});

const updateDepartement = asyncHandler(async (req, res) => {
  const { provinceId, celluleId, departementId } = req.params;
  const userId = req.user?.id || undefined;

  const payload = normalizeMultipartPayload(req);

  const departement = await departementService.updateDepartement(
    provinceId,
    celluleId,
    departementId,
    payload,
    { userId, isPartial: false }
  );

  return res.status(200).json(
    successResponse('Département mis à jour avec succès.', {
      departement,
    })
  );
});

const patchDepartement = asyncHandler(async (req, res) => {
  const { provinceId, celluleId, departementId } = req.params;
  const userId = req.user?.id || undefined;

  const payload = normalizeMultipartPayload(req);

  const departement = await departementService.updateDepartement(
    provinceId,
    celluleId,
    departementId,
    payload,
    { userId, isPartial: true }
  );

  return res.status(200).json(
    successResponse('Département modifié avec succès.', {
      departement,
    })
  );
});

const deleteDepartement = asyncHandler(async (req, res) => {
  const { provinceId, celluleId, departementId } = req.params;

  const departement = await departementService.deleteDepartement(
    provinceId,
    celluleId,
    departementId
  );

  return res.status(200).json(
    successResponse('Département supprimé avec succès.', {
      departement,
    })
  );
});

module.exports = {
  getDepartementsByCellule,
  createDepartement,
  getDepartementDetail,
  updateDepartement,
  patchDepartement,
  deleteDepartement,
};