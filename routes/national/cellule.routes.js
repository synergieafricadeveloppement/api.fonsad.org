// backend/routes/national/cellule.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  debugCellulesDiagnostics,
  getCellulesByProvince,
  createCellule,
  getCelluleDetail,
  updateCellule,
  patchCellule,
  deleteCellule,
} = require('../../controllers/national/cellule.controller');

const uploadResponsablePhoto = require('../../middlewares/uploadResponsablePhoto');

router.get('/debug/diagnostics', debugCellulesDiagnostics);

router
  .route('/')
  .get(getCellulesByProvince)
  .post(uploadResponsablePhoto, createCellule);

router
  .route('/:celluleId')
  .get(getCelluleDetail)
  .put(uploadResponsablePhoto, updateCellule)
  .patch(uploadResponsablePhoto, patchCellule)
  .delete(deleteCellule);

module.exports = router;