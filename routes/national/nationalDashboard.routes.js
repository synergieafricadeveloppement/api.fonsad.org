// backend/routes/national/nationalDashboard.routes.js

const express = require('express');
const router = express.Router();

const {
  getNationalDashboard,
  exportNationalDashboardExcel,
} = require('../../controllers/national/nationalDashboard.controller');

router.get('/', getNationalDashboard);
router.get('/export/excel', exportNationalDashboardExcel);

module.exports = router;