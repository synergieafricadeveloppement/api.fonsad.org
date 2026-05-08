// backend/controllers/national/nationalDashboard.controller.js

const ExcelJS = require('exceljs');

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const nationalSettingsService = require('../../services/nationalSettings.service');

// Modèles
const Province = require('../../models/national/Province');
const Cellule = require('../../models/national/Cellule');
const Departement = require('../../models/national/Departement');
const MembershipRequest = require('../../models/MembershipRequest');
const User = require('../../models/User');

/**
 * Normalisation des settings pour coller à ce qu’attend le frontend.
 */
function normalizeSettings(settings) {
  return {
    structure: {
      provincesEnabled: Boolean(settings?.structure?.provincesEnabled ?? false),
      cellulesEnabled: Boolean(settings?.structure?.cellulesEnabled ?? false),
      departementsEnabled: Boolean(settings?.structure?.departementsEnabled ?? false),
      membersEnabled: Boolean(settings?.structure?.membersEnabled ?? false),
      adhesionsEnabled: Boolean(settings?.structure?.adhesionsEnabled ?? false),
    },
    modules: {
      rh: Boolean(settings?.modules?.rh ?? false),
      finances: Boolean(settings?.modules?.finances ?? false),
      formations: Boolean(settings?.modules?.formations ?? false),
      membres: Boolean(settings?.modules?.membres ?? false),
      adhesions: Boolean(settings?.modules?.adhesions ?? false),
    },
    routes: {
      provincesRouteEnabled: Boolean(
        settings?.routes?.provincesRouteEnabled ?? false
      ),
      settingsRouteEnabled: Boolean(
        settings?.routes?.settingsRouteEnabled ?? true
      ),
      membresRouteEnabled: Boolean(
        settings?.routes?.membresRouteEnabled ?? false
      ),
      adhesionsRouteEnabled: Boolean(
        settings?.routes?.adhesionsRouteEnabled ?? false
      ),
      departementsRouteEnabled: Boolean(
        settings?.routes?.departementsRouteEnabled ?? false
      ),
      cellulesRouteEnabled: Boolean(
        settings?.routes?.cellulesRouteEnabled ?? false
      ),
    },
  };
}

/**
 * GET /api/national/dashboard
 * Retourne les stats + settings pour l’écran national.
 */
const getNationalDashboard = asyncHandler(async (req, res) => {
  const settingsRaw = await nationalSettingsService.getSettings();

  const [
    provincesCount,
    cellulesCount,
    departementsCount,
    adhesionsPendingCount,
    membresCount,
    membresHonneurCount,
    membresActifsCount,
  ] = await Promise.all([
    Province.countDocuments({}),
    Cellule.countDocuments({}),
    Departement.countDocuments({}),
    MembershipRequest.countDocuments({
      status: { $in: ['submitted', 'under_review'] },
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
      memberType: 'honneur',
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
      isActive: true,
    }),
  ]);

  const stats = {
    provincesCount,
    cellulesCount,
    adhesionsPendingCount,
    departementsCount,
    membresCount,
    membresHonneurCount,
    membresActifsCount,
  };

  const settings = normalizeSettings(settingsRaw);

  return res.status(200).json(
    successResponse('Dashboard national récupéré avec succès.', {
      stats,
      settings,
    })
  );
});

/**
 * GET /api/national/dashboard/export/excel
 * Export Excel basique du dashboard.
 */
const exportNationalDashboardExcel = asyncHandler(async (req, res) => {
  const settingsRaw = await nationalSettingsService.getSettings();

  const [
    provincesCount,
    cellulesCount,
    departementsCount,
    adhesionsPendingCount,
    membresCount,
    membresHonneurCount,
    membresActifsCount,
  ] = await Promise.all([
    Province.countDocuments({}),
    Cellule.countDocuments({}),
    Departement.countDocuments({}),
    MembershipRequest.countDocuments({
      status: { $in: ['submitted', 'under_review'] },
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
      memberType: 'honneur',
    }),
    User.countDocuments({
      role: { $in: ['membre', 'adherent'] },
      isActive: true,
    }),
  ]);

  const settings = normalizeSettings(settingsRaw);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FONSAD';
  workbook.created = new Date();

  // Feuille 1 : chiffres clés
  const statsSheet = workbook.addWorksheet('Dashboard');
  statsSheet.columns = [
    { header: 'Indicateur', key: 'label', width: 35 },
    { header: 'Valeur', key: 'value', width: 18 },
  ];

  statsSheet.addRows([
    { label: 'Provinces actives', value: provincesCount },
    { label: 'Cellules suivies', value: cellulesCount },
    { label: 'Départements actifs', value: departementsCount },
    { label: 'Adhésions en attente', value: adhesionsPendingCount },
    { label: 'Nombre de membres', value: membresCount },
    { label: "Membres d'honneur", value: membresHonneurCount },
    { label: 'Membres actifs', value: membresActifsCount },
  ]);

  statsSheet.getRow(1).font = { bold: true };
  statsSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Feuille 2 : settings
  const settingsSheet = workbook.addWorksheet('Settings');
  settingsSheet.columns = [
    { header: 'Bloc', key: 'category', width: 22 },
    { header: 'Clé', key: 'key', width: 30 },
    { header: 'Valeur', key: 'value', width: 18 },
  ];

  Object.entries(settings.structure).forEach(([key, value]) => {
    settingsSheet.addRow({
      category: 'structure',
      key,
      value: value ? 'Activé' : 'Désactivé',
    });
  });

  Object.entries(settings.modules).forEach(([key, value]) => {
    settingsSheet.addRow({
      category: 'modules',
      key,
      value: value ? 'Activé' : 'Désactivé',
    });
  });

  Object.entries(settings.routes).forEach(([key, value]) => {
    settingsSheet.addRow({
      category: 'routes',
      key,
      value: value ? 'Activé' : 'Désactivé',
    });
  });

  settingsSheet.getRow(1).font = { bold: true };
  settingsSheet.views = [{ state: 'frozen', ySplit: 1 }];

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=FONSAD_Dashboard_National.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getNationalDashboard,
  exportNationalDashboardExcel,
};