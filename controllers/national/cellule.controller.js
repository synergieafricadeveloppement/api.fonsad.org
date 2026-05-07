// backend/controllers/national/cellule.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const celluleService = require('../../services/cellule.service');
const NationalSettings = require('../../models/national/NationalSettings');
const Province = require('../../models/national/Province');

function pickNestedValue(raw, flatKey, nestedObjectKey) {
  if (raw?.[flatKey] !== undefined) return raw[flatKey];

  const [parentKey, childKey] = nestedObjectKey.split('.');
  if (raw?.[parentKey] && typeof raw[parentKey] === 'object') {
    return raw[parentKey][childKey];
  }

  return undefined;
}

function buildPayloadFromRequest(req) {
  const raw = req.body || {};
  const file = req.file || null;

  const responsable = {
    fullName: pickNestedValue(raw, 'responsable[fullName]', 'responsable.fullName'),
    fonction:
      pickNestedValue(raw, 'responsable[fonction]', 'responsable.fonction') ||
      'Responsable cellule',
    phone: pickNestedValue(raw, 'responsable[phone]', 'responsable.phone'),
    email: pickNestedValue(raw, 'responsable[email]', 'responsable.email'),
    photoUrl:
      pickNestedValue(raw, 'responsable[photoUrl]', 'responsable.photoUrl') || undefined,
  };

  if (file) {
    responsable.photoUrl = `/uploads/responsables/${file.filename}`;
  }

  return {
    name: raw.name,
    code: raw.code,
    type: raw.type,
    status: raw.status,
    commune: raw.commune,
    zone: raw.zone,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    description: raw.description,
    responsable,
  };
}

// GET /api/national/provinces/:provinceId/cellules/debug/diagnostics
const debugCellulesDiagnostics = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[cellule.controller] debugCellulesDiagnostics => entrée',
    { provinceId }
  );

  const province = await Province.findById(provinceId).lean();
  const settings = await NationalSettings.findOne({ scope: 'national' }).lean();

  let normalizedPermissions = null;
  let listCheck = null;

  try {
    const serviceSettings = await celluleService.getOrCreateSettings();
    normalizedPermissions = celluleService.buildNormalizedPermissions(serviceSettings);
  } catch (error) {
    console.log(
      '[cellule.controller] debugCellulesDiagnostics => erreur buildNormalizedPermissions',
      error
    );

    normalizedPermissions = {
      error: error.message,
    };
  }

  try {
    const result = await celluleService.listCellulesByProvince(provinceId);

    listCheck = {
      ok: true,
      province: result?.province || null,
      governance: result?.governance || null,
      cellulesCount: Array.isArray(result?.cellules) ? result.cellules.length : 0,
      cellulesPreview: Array.isArray(result?.cellules)
        ? result.cellules.slice(0, 5).map((item) => ({
            _id: item?._id,
            name: item?.name,
            code: item?.code,
            type: item?.type,
            status: item?.status,
          }))
        : [],
    };
  } catch (error) {
    console.log(
      '[cellule.controller] debugCellulesDiagnostics => erreur listCellulesByProvince',
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

// GET /api/national/provinces/:provinceId/cellules
const getCellulesByProvince = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[cellule.controller] getCellulesByProvince => entrée',
    { provinceId }
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

// POST /api/national/provinces/:provinceId/cellules
const createCellule = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller] createCellule => entrée',
    { provinceId, userId }
  );

  const payload = buildPayloadFromRequest(req);
  const cellule = await celluleService.createCellule(provinceId, payload, { userId });

  return res.status(201).json(
    successResponse('Cellule créée avec succès.', {
      cellule,
      governance: {
        allowCelluleCreation: true,
      },
    })
  );
});

// GET /api/national/provinces/:provinceId/cellules/:celluleId
const getCelluleDetail = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  console.log(
    '[cellule.controller] getCelluleDetail => entrée',
    { provinceId, celluleId }
  );

  const cellule = await celluleService.getCelluleById(provinceId, celluleId);

  return res.status(200).json(
    successResponse('Détail de la cellule récupéré avec succès.', {
      cellule,
    })
  );
});

// PUT /api/national/provinces/:provinceId/cellules/:celluleId
const updateCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller] updateCellule => entrée',
    { provinceId, celluleId, userId }
  );

  const payload = buildPayloadFromRequest(req);
  const cellule = await celluleService.updateCellule(
    provinceId,
    celluleId,
    payload,
    { userId, isPartial: false }
  );

  return res.status(200).json(
    successResponse('Cellule mise à jour avec succès.', {
      cellule,
    })
  );
});

// PATCH /api/national/provinces/:provinceId/cellules/:celluleId
const patchCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  console.log(
    '[cellule.controller] patchCellule => entrée',
    { provinceId, celluleId, userId }
  );

  const payload = buildPayloadFromRequest(req);
  const cellule = await celluleService.updateCellule(
    provinceId,
    celluleId,
    payload,
    { userId, isPartial: true }
  );

  return res.status(200).json(
    successResponse('Cellule modifiée avec succès.', {
      cellule,
    })
  );
});

// DELETE /api/national/provinces/:provinceId/cellules/:celluleId
const deleteCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  console.log(
    '[cellule.controller] deleteCellule => entrée',
    { provinceId, celluleId }
  );

  const deleted = await celluleService.deleteCellule(provinceId, celluleId);

  return res.status(200).json(
    successResponse('Cellule supprimée avec succès.', {
      cellule: deleted,
    })
  );
});

module.exports = {
  buildPayloadFromRequest,
  debugCellulesDiagnostics,
  getCellulesByProvince,
  createCellule,
  getCelluleDetail,
  updateCellule,
  patchCellule,
  deleteCellule,
};