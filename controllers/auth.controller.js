const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { createOtp, verifyOtp } = require('../services/otpService');
const { sendMail } = require('../services/mailService');
const { signAccessToken } = require('../services/tokenService');
const otpEmailTemplate = require('../templates/otpEmailTemplate');
const welcomeEmailTemplate = require('../templates/welcomeEmailTemplate');

async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide.',
      });
    }

    const valid = await user.comparePassword(password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide.',
      });
    }

    const token = signAccessToken(user);

    return res.json({
      success: true,
      message: 'Connexion réussie.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion.',
      error: error.message,
    });
  }
}

async function registerRequest(req, res) {
  try {
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

    const otpData = await createOtp(normalizedEmail, 'register_verification', 10);

    await sendMail({
      to: normalizedEmail,
      subject: 'FONSAD - Vérification de votre inscription',
      htmlContent: otpEmailTemplate({
        title: 'Code OTP d’inscription',
        intro: 'Utilisez ce code pour confirmer votre inscription sur la plateforme FONSAD.',
        code: otpData.code,
        minutes: 10,
      }),
    });

    return res.json({
      success: true,
      message: 'Code OTP envoyé pour finaliser l’inscription.',
      email: normalizedEmail,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la demande d'inscription.",
      error: error.message,
    });
  }
}

async function registerResendOtp(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email requise.',
      });
    }

    const pending = await PendingRegistration.findOne({ email }).sort({ createdAt: -1 });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Aucune inscription en attente trouvée.',
      });
    }

    const otpData = await createOtp(email, 'register_verification', 10);

    await sendMail({
      to: email,
      subject: 'FONSAD - Nouveau code OTP d’inscription',
      htmlContent: otpEmailTemplate({
        title: 'Nouveau code OTP',
        intro: 'Voici votre nouveau code OTP pour finaliser votre inscription FONSAD.',
        code: otpData.code,
        minutes: 10,
      }),
    });

    return res.json({
      success: true,
      message: 'Un nouveau code OTP a été envoyé.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du renvoi de l'OTP.",
      error: error.message,
    });
  }
}

async function registerVerify(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email et OTP requis.',
      });
    }

    const verification = await verifyOtp(email, 'register_verification', otp);

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

    await sendMail({
      to: user.email,
      subject: 'FONSAD - Bienvenue',
      htmlContent: welcomeEmailTemplate({
        firstName: user.firstName,
      }),
    });

    const token = signAccessToken(user);

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification d'inscription.",
      error: error.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email requise.',
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      const otpData = await createOtp(email, 'password_reset', 10);

      await sendMail({
        to: email,
        subject: 'FONSAD - Réinitialisation du mot de passe',
        htmlContent: otpEmailTemplate({
          title: 'Réinitialisation du mot de passe',
          intro: 'Utilisez ce code OTP pour réinitialiser votre mot de passe FONSAD.',
          code: otpData.code,
          minutes: 10,
        }),
      });
    }

    return res.json({
      success: true,
      message: 'Si ce compte existe, un code OTP a été envoyé.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la demande de réinitialisation.',
      error: error.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
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

    const verification = await verifyOtp(email, 'password_reset', otp);

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation.',
      error: error.message,
    });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  login,
  registerRequest,
  registerResendOtp,
  registerVerify,
  forgotPassword,
  resetPassword,
  me,
};