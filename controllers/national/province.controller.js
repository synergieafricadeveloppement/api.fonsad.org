// backend/controllers/national/province.controller.js

const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const provinceService = require('../../services/province.service');
const nationalSettingsService = require('../../services/nationalSettings.service');
const AppError = require('../../utils/AppError');

// GET /api/national/provinces
const getProvinces = asyncHandler(async (_req, res) => {
  const { provinces, governance } = await provinceService.listProvincesWithGovernance();

  return res.status(200).json(
    successResponse('Provinces récupérées avec succès.', {
      provinces,
      governance,
    })
  );
});

// GET /api/national/provinces/:provinceId
const getProvinceDetail = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  if (!mongoose.isValidObjectId(provinceId)) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de province invalide.',
    });
  }

  const province = await provinceService.getProvinceById(provinceId);

  return res.status(200).json(
    successResponse('Détail de la province récupéré avec succès.', {
      province,
    })
  );
});

// POST /api/national/provinces
const createProvince = asyncHandler(async (req, res) => {
  const userId = req.user?.id || undefined;
  const raw = req.body || {};
  const file = req.file || null;

  // On relit les settings nationaux pour sécuriser la création côté serveur
  const settings = await nationalSettingsService.getSettings();
  const allowProvinceCreation =
    settings?.governance?.allowProvinceCreation === true;

  if (!allowProvinceCreation) {
    throw new AppError(
      'La création de province est actuellement désactivée par les settings nationaux.',
      403
    );
  }

  const payload = {
    name: raw.name,
    code: raw.code,
    country: raw.country,
    chefLieu: raw.chefLieu,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    description: raw.description,
    status: raw.status,
    responsable: {
      fullName: raw['responsable[fullName]'] || raw.responsable?.fullName,
      fonction:
        raw['responsable[fonction]'] ||
        raw.responsable?.fonction ||
        'Coordinateur provincial',
      phone: raw['responsable[phone]'] || raw.responsable?.phone,
      email: raw['responsable[email]'] || raw.responsable?.email,
      sexe: raw['responsable[sexe]'] || raw.responsable?.sexe,
      photoUrl: undefined,
    },
    bootstrapStructure: {
      generateDefaultDepartements:
        raw['bootstrapStructure[generateDefaultDepartements]'] === 'true' ||
        raw.bootstrapStructure?.generateDefaultDepartements === true,
      departements: [],
      celluleId:
        raw['bootstrapStructure[celluleId]'] ||
        raw.bootstrapStructure?.celluleId,
    },
  };

  if (file) {
    const publicPath = `/uploads/responsables/${file.filename}`;
    payload.responsable.photoUrl = publicPath;
  }

  if (raw['bootstrapStructure[departements]']) {
    try {
      payload.bootstrapStructure.departements = JSON.parse(
        raw['bootstrapStructure[departements]']
      );
    } catch (_error) {
      payload.bootstrapStructure.departements = [];
    }
  } else if (Array.isArray(raw.bootstrapStructure?.departements)) {
    payload.bootstrapStructure.departements =
      raw.bootstrapStructure.departements;
  }

  const province = await provinceService.createProvince(payload, { userId });

  return res.status(201).json(
    successResponse('Province créée avec succès.', {
      province,
      governance: {
        allowProvinceCreation: true,
      },
    })
  );
});

// GET /api/national/provinces/:provinceId/export
const exportProvinceData = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  if (!mongoose.isValidObjectId(provinceId)) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de province invalide.',
    });
  }

  const data = await provinceService.getProvinceDataForExport(provinceId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Votre application';
  workbook.created = new Date();

  const sheet1 = workbook.addWorksheet('Cellules');
  sheet1.columns = [
    { header: 'ID', key: '_id', width: 25 },
    { header: 'Nom', key: 'name', width: 30 },
    { header: 'Membres', key: 'membresCount', width: 15 },
  ];
  sheet1.addRows(data.cellules || []);
  sheet1.getRow(1).font = { bold: true };
  sheet1.views = [{ state: 'frozen', ySplit: 1 }];

  const sheet2 = workbook.addWorksheet('Synthèse');
  sheet2.columns = [
    { header: 'Indicateur', key: 'label', width: 30 },
    { header: 'Valeur', key: 'value', width: 15 },
  ];
  sheet2.addRows(data.synthese || []);
  sheet2.getRow(1).font = { bold: true };
  sheet2.views = [{ state: 'frozen', ySplit: 1 }];

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Province_${provinceId}_Rapport.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getProvinces,
  getProvinceDetail,
  createProvince,
  exportProvinceData,
};