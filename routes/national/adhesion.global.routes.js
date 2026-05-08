// backend/routes/national/adhesion.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getAllAdhesionsGroupedByProvince,
} = require('../../controllers/national/adhesion.global.controller');

router.get('/', getAllAdhesionsGroupedByProvince);

module.exports = router;