const express = require('express');
const { createMembershipRequest } = require('../controllers/membershipController');

const router = express.Router();

router.post('/', createMembershipRequest);

module.exports = router;