// backend/routes/national/cellule.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getCellulesByProvince,
  createCellule,
  getCelluleDetail,
  updateCellule,
  patchCellule,
  deleteCellule,
  debugCellulesDiagnostics,
} = require('../../controllers/national/cellule.controller');

const uploadResponsablePhoto = require('../../middlewares/uploadResponsablePhoto');

// Route debug temporaire sans token
// Important : elle doit être déclarée avant '/:celluleId'
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