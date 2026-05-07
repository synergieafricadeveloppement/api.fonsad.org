// backend/controllers/national/nationalDashboard.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

/**
 * GET /api/national/dashboard
 * Retourne les stats + settings utiles à l’écran national.
 */
const getNationalDashboard = asyncHandler(async (req, res) => {
  // IMPORTANT :
  // Ici on met une version de démarrage stable.
  // Plus tard, on branchera les vrais comptes depuis les collections Mongo.
  const stats = {
    provincesCount: 0,
    cellulesCount: 0,
    adhesionsPendingCount: 0,
    departementsCount: 0,
    membresCount: 0,
    membresHonneurCount: 0,
    membresActifsCount: 0,
  };

  const settings = {
    structure: {
      provincesEnabled: true,
      cellulesEnabled: true,
      departementsEnabled: true,
      membersEnabled: true,
      adhesionsEnabled: true,
    },
    modules: {
      rh: true,
      finances: true,
      formations: true,
      membres: true,
      adhesions: true,
    },
    routes: {
      provincesRouteEnabled: true,
      settingsRouteEnabled: true,
      membresRouteEnabled: true,
      adhesionsRouteEnabled: true,
      departementsRouteEnabled: true,
      cellulesRouteEnabled: true,
    },
  };

  return res.status(200).json(
    successResponse('Dashboard national récupéré avec succès.', {
      stats,
      settings,
    })
  );
});

/**
 * GET /api/national/dashboard/export/excel
 * Endpoint temporaire d’export.
 * Plus tard on branchera ExcelJS.
 */
const exportNationalDashboardExcel = asyncHandler(async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "L'export Excel n'est pas encore branché côté backend.",
  });
});

module.exports = {
  getNationalDashboard,
  exportNationalDashboardExcel,
};