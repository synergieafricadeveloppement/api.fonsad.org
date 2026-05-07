const express = require('express');
const router = express.Router();

const {
  getProvinces,
  getProvinceDetail,
  createProvince,
  exportProvinceData,
} = require('../../controllers/national/province.controller');

const celluleRoutes = require('./cellule.routes');
const departementRoutes = require('./departement.routes');
const uploadResponsablePhoto = require('../../middlewares/uploadResponsablePhoto');
const provinceService = require('../../services/province.service');

// DEBUG public : à garder temporairement pour vérifier la gouvernance
router.get('/debug-governance', async (req, res, next) => {
  try {
    const settings = await provinceService.getOrCreateSettings();
    const { governance, provinces } =
      await provinceService.listProvincesWithGovernance();

    return res.status(200).json({
      success: true,
      message: 'Debug gouvernance provinces.',
      data: {
        governance,
        settingsSnapshot: {
          governance: settings?.governance || {},
          structure: settings?.structure || {},
          routes: settings?.routes || {},
        },
        provincesCount: Array.isArray(provinces) ? provinces.length : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Liste + création
router
  .route('/')
  .get(getProvinces)
  .post(uploadResponsablePhoto, createProvince);

// Export spécifique
router.get('/:provinceId/export', exportProvinceData);

// Détail province
router
  .route('/:provinceId')
  .get(getProvinceDetail);

// Sous-routes liées à une province
router.use('/:provinceId/cellules', celluleRoutes);
router.use('/:provinceId/cellules/:celluleId/departements', departementRoutes);

module.exports = router;