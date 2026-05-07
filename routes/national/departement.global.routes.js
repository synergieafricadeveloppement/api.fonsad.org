// backend/routes/national/departement.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getDepartementDetail,
} = require('../../controllers/national/departement.controller');

router.get('/:departementId', getDepartementDetail);

module.exports = router;