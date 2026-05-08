// backend/routes/national/national.routes.js

const express = require('express');

const provinceController = require('../controllers/national/province.controller');
const celluleController = require('../controllers/national/cellule.controller');
const departementController = require('../controllers/national/departement.controller');

const router = express.Router();

router.get('/provinces', provinceController.getProvinces);
router.get('/provinces/:provinceId', provinceController.getProvinceDetail);

router.get(
  '/provinces/:provinceId/cellules/:celluleId',
  celluleController.getCelluleDetail
);

router.get(
  '/provinces/:provinceId/cellules/:celluleId/departements',
  departementController.getDepartements
);

router.post(
  '/provinces/:provinceId/cellules/:celluleId/departements',
  departementController.createDepartement
);

router.put(
  '/provinces/:provinceId/cellules/:celluleId/departements/:departementId',
  departementController.updateDepartement
);

module.exports = router;