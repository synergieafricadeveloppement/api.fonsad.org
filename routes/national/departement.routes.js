// backend/routes/national/departement.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getDepartementsByCellule,
  createDepartement,
  getDepartementDetail,
  updateDepartement,
  patchDepartement,
  deleteDepartement,
} = require('../../controllers/national/departement.controller');

const uploadDepartementPhotos = require('../../middlewares/uploadDepartementPhotos');

router
  .route('/')
  .get(getDepartementsByCellule)
  .post(uploadDepartementPhotos, createDepartement);

router
  .route('/:departementId')
  .get(getDepartementDetail)
  .put(uploadDepartementPhotos, updateDepartement)
  .patch(uploadDepartementPhotos, patchDepartement)
  .delete(deleteDepartement);

module.exports = router;