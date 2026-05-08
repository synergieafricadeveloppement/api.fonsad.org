// backend/routes/ntional/province.routes.js 

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

router
  .route('/')
  .get(getProvinces)
  .post(uploadResponsablePhoto, createProvince);

router.get('/:provinceId/export', exportProvinceData);

router
  .route('/:provinceId')
  .get(getProvinceDetail);

router.use('/:provinceId/cellules', celluleRoutes);
router.use('/:provinceId/cellules/:celluleId/departements', departementRoutes);

module.exports = router;