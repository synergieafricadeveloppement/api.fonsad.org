const express = require('express');
const {
  login,
  registerRequest,
  registerResendOtp,
  registerVerify,
  forgotPassword,
  resetPassword,
  me,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);

router.post('/register/request', registerRequest);
router.post('/register/resend-otp', registerResendOtp);
router.post('/register/verify', registerVerify);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, me);

module.exports = router;