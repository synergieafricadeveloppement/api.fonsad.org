// backend/controllers/national/cellule.controller.js

const mongoose = require('mongoose');

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const celluleService = require('../../services/cellules.services');
const NationalSettings = require('../../models/national/NationalSettings');
const Province = require('../../models/national/Province');

/**
 * Helpers pour récupérer les champs imbriqués JSON / form-data
 */
function pickNestedValue(raw, flatKey, nestedObjectKey) {
  if (raw?.[flatKey] !== undefined) return raw[flatKey];

  const [parentKey, childKey] = nestedObjectKey.split('.');
  if (raw?.[parentKey] && typeof raw[parentKey] === 'object') {
    return raw[parentKey][childKey];
  }

  return undefined;
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized.length ? normalized : undefined;
}

function normalizeEmail(value) {
  const normalized = cleanString(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

/**
 * Construit le payload métier à partir de req
 * Compatible JSON pur (frontend mobile) + multipart/form-data (upload photo).
 */
function buildPayloadFromRequest(req) {
  const raw = req.body || {};
  const file = req.file || null;

  const responsable = {
    fullName: cleanString(
      pickNestedValue(raw, 'responsableFullName', 'responsable.fullName')
    ),
    fonction:
      cleanString(
        pickNestedValue(raw, 'responsableFonction', 'responsable.fonction')
      ) || 'Responsable cellule',
    phone: cleanString(
      pickNestedValue(raw, 'responsablePhone', 'responsable.phone')
    ),
    email: normalizeEmail(
      pickNestedValue(raw, 'responsableEmail', 'responsable.email')
    ),
    photoUrl: cleanString(
      pickNestedValue(raw, 'responsablePhotoUrl', 'responsable.photoUrl')
    ),
  };

  if (file) {
    responsable.photoUrl = `/uploads/responsables/${file.filename}`;
  }

  return {
    name: cleanString(raw.name),
    code: cleanString(raw.code)?.toUpperCase(),
    type: cleanString(raw.type)?.toUpperCase() || 'COMMUNE',
    status: cleanString(raw.status)?.toUpperCase() || 'ACTIVE',
    commune: cleanString(raw.commune),
    zone: cleanString(raw.zone),
    address: cleanString(raw.address),
    phone: cleanString(raw.phone),
    email: normalizeEmail(raw.email),
    description: cleanString(raw.description),
    responsable,
  };
}

/**
 * GET /api/national/provinces/:provinceId/cellules/debug/diagnostics
 * (outil debug si tu en as besoin, repris tel quel du paste)
 */
const debugCellulesDiagnostics = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[cellule.controller.debugCellulesDiagnostics] entre, provinceId =',
    provinceId
  );

  const province = await Province.findById(provinceId).lean();
  const settings = await NationalSettings.findOne({ scope: 'national' }).lean();

  let normalizedPermissions = null;
  let listCheck = null;

  try {
    const serviceSettings = await celluleService.getOrCreateSettings();
    normalizedPermissions =
      celluleService.buildNormalizedPermissions(serviceSettings);
  } catch (error) {
    console.log(
      '[cellule.controller.debugCellulesDiagnostics] erreur buildNormalizedPermissions =',
      error
    );
    normalizedPermissions = { error: error.message };
  }

  try {
    const result = await celluleService.listCellulesByProvince(provinceId);
    listCheck = {
      ok: true,
      province: result?.province || null,
      governance: result?.governance || null,
      cellulesCount: Array.isArray(result?.cellules)
        ? result.cellules.length
        : 0,
      cellulesPreview: Array.isArray(result?.cellules)
        ? result.cellules.slice(0, 5).map((item) => ({
            id: item?.id,
            name: item?.name,
            code: item?.code,
            type: item?.type,
            status: item?.status,
          }))
        : [],
    };
  } catch (error) {
    console.log(
      '[cellule.controller.debugCellulesDiagnostics] erreur listCellulesByProvince =',
      error
    );
    listCheck = {
      ok: false,
      message: error.message,
      statusCode: error.statusCode || error.status || 500,
    };
  }

  return res.status(200).json(
    successResponse('Diagnostic cellules récupéré avec succès.', {
      provinceId,
      provinceExists: !!province,
      province,
      rawSettings: settings,
      normalizedPermissions,
      listCheck,
    })
  );
});

/**
 * GET /api/national/provinces/:provinceId/cellules
 */
const getCellulesByProvince = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[cellule.controller.getCellulesByProvince] entre, provinceId =',
    provinceId
  );

  const result = await celluleService.listCellulesByProvince(provinceId);

  return res.status(200).json(
    successResponse('Cellules récupérées avec succès.', {
      province: result.province,
      cellules: result.cellules,
      governance: result.governance,
    })
  );
});

/**
 * POST /api/national/provinces/:provinceId/cellules
 */
const createCellule = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller.createCellule] entre, provinceId =',
    provinceId,
    ', userId =',
    userId
  );

  const payload = buildPayloadFromRequest(req);

  const cellule = await celluleService.createCellule(provinceId, payload, userId);

  return res.status(201).json(
    successResponse('Cellule créée avec succès.', {
      cellule,
      governance: {
        allowCelluleCreation: true,
      },
    })
  );
});

/**
 * GET /api/national/provinces/:provinceId/cellules/:celluleId
 * -> version fusionnée: utilise getCelluleByIdWithStats
 */
const getCelluleDetail = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  console.log(
    '[cellule.controller.getCelluleDetail] entre, provinceId =',
    provinceId,
    ', celluleId =',
    celluleId
  );

  if (!provinceId || !mongoose.isValidObjectId(provinceId)) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de province invalide.',
    });
  }

  if (!celluleId || !mongoose.isValidObjectId(celluleId)) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de cellule invalide.',
    });
  }

  const cellule = await celluleService.getCelluleByIdWithStats(
    provinceId,
    celluleId
  );

  return res.status(200).json(
    successResponse('Détail de la cellule récupéré avec succès.', {
      cellule,
    })
  );
});

/**
 * PUT /api/national/provinces/:provinceId/cellules/:celluleId
 * (mise à jour complète)
 */
const updateCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller.updateCellule] entre, provinceId =',
    provinceId,
    ', celluleId =',
    celluleId,
    ', userId =',
    userId
  );

  const payload = buildPayloadFromRequest(req);

  const cellule = await celluleService.updateCellule(
    provinceId,
    celluleId,
    payload,
    userId,
    { isPartial: false }
  );

  return res.status(200).json(
    successResponse('Cellule mise à jour avec succès.', {
      cellule,
    })
  );
});

/**
 * PATCH /api/national/provinces/:provinceId/cellules/:celluleId
 * (mise à jour partielle)
 */
const patchCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller.patchCellule] entre, provinceId =',
    provinceId,
    ', celluleId =',
    celluleId,
    ', userId =',
    userId
  );

  const payload = buildPayloadFromRequest(req);

  const cellule = await celluleService.updateCellule(
    provinceId,
    celluleId,
    payload,
    userId,
    { isPartial: true }
  );

  return res.status(200).json(
    successResponse('Cellule modifiée avec succès.', {
      cellule,
    })
  );
});

/**
 * DELETE /api/national/provinces/:provinceId/cellules/:celluleId
 */
const deleteCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  console.log(
    '[cellule.controller.deleteCellule] entre, provinceId =',
    provinceId,
    ', celluleId =',
    celluleId
  );

  const deleted = await celluleService.deleteCellule(provinceId, celluleId);

  return res.status(200).json(
    successResponse('Cellule supprimée avec succès.', {
      cellule: deleted,
    })
  );
});

module.exports = {
  cleanString,
  normalizeEmail,
  buildPayloadFromRequest,

  debugCellulesDiagnostics,
  getCellulesByProvince,
  createCellule,
  getCelluleDetail,
  updateCellule,
  patchCellule,
  deleteCellule,
};