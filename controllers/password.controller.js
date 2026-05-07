import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createOtp, verifyOtp } from '../services/otp.service.js';
import { sendMail } from '../services/mail.service.js';
import { otpEmailTemplate } from '../templates/otp.template.js';

export async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Adresse email requise.',
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    const { code } = await createOtp({
      email,
      purpose: 'password_reset',
      ttlMinutes: 10,
    });

    await sendMail({
      to: email,
      subject: 'FONSAD - Code OTP de réinitialisation',
      textContent: `Votre code OTP est ${code}. Il expire dans 10 minutes.`,
      htmlContent: otpEmailTemplate({
        title: 'Réinitialisation du mot de passe',
        intro: 'Utilisez le code ci-dessous pour réinitialiser votre mot de passe FONSAD.',
        code,
        minutes: 10,
      }),
    });
  }

  return res.json({
    success: true,
    message: 'Si ce compte existe, un code OTP a été envoyé.',
  });
}

export async function resetPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const newPassword = String(req.body.newPassword || '').trim();

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP et nouveau mot de passe sont requis.',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Le mot de passe doit contenir au moins 6 caractères.',
    });
  }

  const verification = await verifyOtp({
    email,
    purpose: 'password_reset',
    code: otp,
  });

  if (!verification.ok) {
    return res.status(400).json({
      success: false,
      message: verification.message,
    });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Compte introuvable.',
    });
  }

  user.password = newPassword;
  await user.save();

  return res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès.',
  });
}