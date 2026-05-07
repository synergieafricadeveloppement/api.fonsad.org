import { User } from '../models/User.js';
import { PendingRegistration } from '../models/PendingRegistration.js';
import { createOtp, verifyOtp } from '../services/otp.service.js';
import { sendMail } from '../services/mail.service.js';
import { otpEmailTemplate } from '../templates/otp.template.js';
import { signAccessToken } from '../services/token.service.js';

export async function requestRegister(req, res) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    level,
    department,
    role,
    provinceName,
    celluleName,
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!firstName || !lastName || !normalizedEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Champs obligatoires manquants.',
    });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Un compte existe déjà avec cet email.',
    });
  }

  await PendingRegistration.deleteMany({ email: normalizedEmail });

  await PendingRegistration.create({
    firstName,
    lastName,
    email: normalizedEmail,
    phone,
    password,
    level,
    department,
    role,
    provinceName,
    celluleName,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const { code } = await createOtp({
    email: normalizedEmail,
    purpose: 'register_verification',
    ttlMinutes: 10,
  });

  await sendMail({
    to: normalizedEmail,
    subject: 'FONSAD - Vérification de votre inscription',
    textContent: `Votre code OTP est ${code}. Il expire dans 10 minutes.`,
    htmlContent: otpEmailTemplate({
      title: 'Validation de l’inscription',
      intro: 'Utilisez ce code OTP pour valider votre inscription FONSAD.',
      code,
      minutes: 10,
    }),
  });

  return res.json({
    success: true,
    message: 'Code OTP envoyé pour finaliser l’inscription.',
    email: normalizedEmail,
  });
}

export async function verifyRegister(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();

  const verification = await verifyOtp({
    email,
    purpose: 'register_verification',
    code: otp,
  });

  if (!verification.ok) {
    return res.status(400).json({
      success: false,
      message: verification.message,
    });
  }

  const pending = await PendingRegistration.findOne({ email }).sort({ createdAt: -1 });

  if (!pending) {
    return res.status(404).json({
      success: false,
      message: 'Aucune inscription en attente trouvée.',
    });
  }

  const user = await User.create({
    firstName: pending.firstName,
    lastName: pending.lastName,
    email: pending.email,
    phone: pending.phone,
    password: pending.password,
    level: pending.level,
    department: pending.department,
    role: pending.role,
    provinceName: pending.provinceName,
    celluleName: pending.celluleName,
    emailVerified: true,
  });

  await PendingRegistration.deleteMany({ email });

  const token = signAccessToken(user);

  return res.status(201).json({
    success: true,
    message: 'Compte créé avec succès.',
    token,
    user: user.toJSON(),
  });
}