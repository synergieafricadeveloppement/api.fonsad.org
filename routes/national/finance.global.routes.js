// backend/routes/national/finance.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getAllFinancesGroupedByProvince,
} = require('../../controllers/national/finance.global.controller');

router.get('/', getAllFinancesGroupedByProvince);

module.exports = router;