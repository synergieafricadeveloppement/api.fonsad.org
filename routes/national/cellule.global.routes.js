// backend/routes/national/cellule.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getAllCellulesGroupedByProvince,
} = require('../../controllers/national/cellule.global.controller');

router.get('/', getAllCellulesGroupedByProvince);

module.exports = router;