// backend/routes/national/membre.global.routes.js

const express = require('express');
const router = express.Router();

const {
  getAllMembresGroupedByProvince,
} = require('../../controllers/national/membre.global.controller');

router.get('/', getAllMembresGroupedByProvince);

module.exports = router;