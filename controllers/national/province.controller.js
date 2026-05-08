// backend/controllers/national/province.controller.js

const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const provinceService = require('../../services/province.service');
const nationalSettingsService = require('../../services/nationalSettings.service');
const AppError = require('../../utils/AppError');

/**
 * Normalise un booléen venant du multipart/form-data.
 */
const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

/**
 * Parse un JSON sans casser la requête.
 */
const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
};

/**
 * Construit un nom de fichier Excel safe.
 */
const buildSafeExcelFileName = (province) => {
  const base =
    String(province?.name || province?._id || 'province')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'province';

  return `Province_${base}_Rapport.xlsx`;
};

/**
 * GET /api/national/provinces
 */
const getProvinces = asyncHandler(async (_req, res) => {
  const { provinces, governance } =
    await provinceService.listProvincesWithGovernance();

  return res.status(200).json(
    successResponse('Provinces récupérées avec succès.', {
      provinces,
      governance,
    })
  );
});

/**
 * GET /api/national/provinces/:provinceId
 * On renvoie le détail avec cellulesCount + membresCount recalculés,
 * basés sur les cellules de la province.
 */
const getProvinceDetail = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[province.controller.getProvinceDetail] provinceId param =',
    provinceId
  );

  if (!provinceId || !mongoose.isValidObjectId(provinceId)) {
    console.log(
      '[province.controller.getProvinceDetail] INVALID provinceId =',
      provinceId
    );

    return res.status(400).json({
      success: false,
      message: 'Identifiant de province invalide.',
    });
  }

  const province = await provinceService.getProvinceByIdWithStats(provinceId);

  return res.status(200).json(
    successResponse('Détail de la province récupéré avec succès.', {
      province,
    })
  );
});

/**
 * POST /api/national/provinces
 */
const createProvince = asyncHandler(async (req, res) => {
  const userId = req.user?.id || undefined;
  const raw = req.body || {};
  const file = req.file || null;

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
      generateDefaultDepartements: toBoolean(
        raw['bootstrapStructure[generateDefaultDepartements]'] ??
          raw.bootstrapStructure?.generateDefaultDepartements,
        false
      ),
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
    payload.bootstrapStructure.departements = safeJsonParse(
      raw['bootstrapStructure[departements]'],
      []
    );
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

/**
 * GET /api/national/provinces/:provinceId/export
 */
const exportProvinceData = asyncHandler(async (req, res) => {
  const { provinceId } = req.params;

  console.log(
    '[province.controller.exportProvinceData] provinceId param =',
    provinceId
  );

  if (!provinceId || !mongoose.isValidObjectId(provinceId)) {
    return res.status(400).json({
      success: false,
      message: 'Identifiant de province invalide.',
    });
  }

  const data = await provinceService.getProvinceDataForExport(provinceId);

  if (!data || !data.province) {
    return res.status(404).json({
      success: false,
      message: 'Province introuvable.',
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FONSAD';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = 'Export province';
  workbook.title = `Rapport province - ${data.province?.name || provinceId}`; 

  const sheet1 = workbook.addWorksheet('Cellules');
  sheet1.columns = [
    { header: 'ID', key: '_id', width: 28 },
    { header: 'Nom', key: 'name', width: 30 },
    { header: 'Code', key: 'code', width: 18 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Statut', key: 'status', width: 18 },
    { header: 'Commune', key: 'commune', width: 22 },
    { header: 'Zone', key: 'zone', width: 22 },
    { header: 'Téléphone', key: 'phone', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Membres', key: 'membresCount', width: 14 },
    { header: 'Départements', key: 'departementsCount', width: 16 },
  ];

  sheet1.addRows(
    Array.isArray(data.cellules)
      ? data.cellules.map((item) => ({
          _id: item?._id || '',
          name: item?.name || '',
          code: item?.code || '',
          type: item?.type || '',
          status: item?.status || '',
          commune: item?.commune || '',
          zone: item?.zone || '',
          phone: item?.phone || '',
          email: item?.email || '',
          membresCount: Number(item?.membresCount ?? 0),
          departementsCount: Number(item?.departementsCount ?? 0),
        }))
      : []
  );

  sheet1.getRow(1).font = { bold: true };
  sheet1.views = [{ state: 'frozen', ySplit: 1 }];

  const sheet2 = workbook.addWorksheet('Synthèse');
  sheet2.columns = [
    { header: 'Indicateur', key: 'label', width: 34 },
    { header: 'Valeur', key: 'value', width: 22 },
  ];

  const syntheseRows = Array.isArray(data.synthese)
    ? data.synthese
    : [
        { label: 'Province', value: data.province?.name || '' },
        { label: 'ID Province', value: data.province?._id || provinceId },
        { label: 'Code', value: data.province?.code || '' },
        { label: 'Chef-lieu', value: data.province?.chefLieu || '' },
        { label: 'Statut', value: data.province?.status || '' },
        {
          label: 'Nombre total de cellules',
          value: Number(
            data.province?.cellulesCount ?? data.cellules?.length ?? 0
          ),
        },
        {
          label: 'Nombre total de membres',
          value: Number(data.province?.membresCount ?? 0),
        },
      ];

  sheet2.addRows(syntheseRows);
  sheet2.getRow(1).font = { bold: true };
  sheet2.views = [{ state: 'frozen', ySplit: 1 }];

  const sheet3 = workbook.addWorksheet('Province');
  sheet3.columns = [
    { header: 'Champ', key: 'field', width: 28 },
    { header: 'Valeur', key: 'value', width: 40 },
  ];

  sheet3.addRows([
    { field: 'ID', value: data.province?._id || provinceId },
    { field: 'Nom', value: data.province?.name || '' },
    { field: 'Code', value: data.province?.code || '' },
    { field: 'Slug', value: data.province?.slug || '' },
    { field: 'Pays', value: data.province?.country || '' },
    { field: 'Chef-lieu', value: data.province?.chefLieu || '' },
    { field: 'Adresse', value: data.province?.address || '' },
    { field: 'Téléphone', value: data.province?.phone || '' },
    { field: 'Email', value: data.province?.email || '' },
    { field: 'Statut', value: data.province?.status || '' },
    { field: 'Description', value: data.province?.description || '' },
    {
      field: 'Responsable principal',
      value: data.province?.responsable?.fullName || '',
    },
    {
      field: 'Fonction responsable',
      value: data.province?.responsable?.fonction || '',
    },
    {
      field: 'Téléphone responsable',
      value: data.province?.responsable?.phone || '',
    },
    {
      field: 'Email responsable',
      value: data.province?.responsable?.email || '',
    },
    {
      field: 'Cellules',
      value: Number(data.province?.cellulesCount ?? 0),
    },
    {
      field: 'Membres',
      value: Number(data.province?.membresCount ?? 0),
    },
    {
      field: 'Créé le',
      value: data.province?.createdAt
        ? new Date(data.province.createdAt).toISOString()
        : '',
    },
    {
      field: 'Mis à jour le',
      value: data.province?.updatedAt
        ? new Date(data.province.updatedAt).toISOString()
        : '',
    },
  ]);

  sheet3.getRow(1).font = { bold: true };
  sheet3.views = [{ state: 'frozen', ySplit: 1 }];

  const filename = buildSafeExcelFileName(data.province);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getProvinces,
  getProvinceDetail,
  createProvince,
  exportProvinceData,
};