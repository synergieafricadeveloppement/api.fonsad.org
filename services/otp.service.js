const crypto = require('crypto');
const OtpCode = require('../models/OtpCode');

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function createOtp(email, purpose, ttlMinutes = 10) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  await OtpCode.deleteMany({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await OtpCode.create({
    email: normalizedEmail,
    code,
    purpose,
    expiresAt,
  });

  return { code, expiresAt };
}

async function verifyOtp(email, purpose, code) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const otp = await OtpCode.findOne({
    email: normalizedEmail,
    purpose,
    code: String(code || '').trim(),
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { ok: false, message: 'Code OTP invalide.' };
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'Code OTP expiré.' };
  }

  otp.consumedAt = new Date();
  await otp.save();

  return { ok: true, otp };
}

module.exports = {
  createOtp,
  verifyOtp,
};