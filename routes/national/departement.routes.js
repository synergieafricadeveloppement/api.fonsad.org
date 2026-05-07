// backend/routes/national/departement.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getDepartementsByCellule,
  createDepartement,
  getDepartementDetail,
} = require('../../controllers/national/departement.controller');

router
  .route('/')
  .get(getDepartementsByCellule)
  .post(createDepartement);

router
  .route('/:departementId')
  .get(getDepartementDetail);

module.exports = router;