// backend/routes/national/departement.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getDepartementDetail,
} = require('../../controllers/national/departement.controller');
const {
  getAllDepartementsGroupedByProvince,
} = require('../../controllers/national/departement.global.controller');

router.get('/:departementId', getDepartementDetail);
router.get('/', getAllDepartementsGroupedByProvince);

module.exports = router;