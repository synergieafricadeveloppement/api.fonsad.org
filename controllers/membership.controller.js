const MembershipRequest = require('../models/MembershipRequest');
const { sendMail } = require('../services/mailService');
const membershipEmailTemplate = require('../templates/membershipEmailTemplate');

function getAdminEmails() {
  const raw = [
    process.env.ADMIN_NOTIFICATION_EMAIL,
    process.env.ADMINNOTIFICATIONEMAIL,
    ...(process.env.ADMIN_NOTIF_EMAILS || '').split(','),
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return [...new Set(raw)];
}

async function createMembershipRequest(req, res) {
  try {
    const payload = req.body;

    const request = await MembershipRequest.create(payload);

    await sendMail({
      to: request.email,
      subject: 'FONSAD - Demande d’adhésion reçue',
      htmlContent: membershipEmailTemplate({
        firstName: request.firstName,
        requestedLevel: request.requestedLevel,
        requestedDepartment: request.requestedDepartment,
        requestedRole: request.requestedRole,
      }),
    });

    const adminEmails = getAdminEmails();
    if (adminEmails.length) {
      await sendMail({
        to: adminEmails,
        subject: 'FONSAD - Nouvelle demande d’adhésion',
        htmlContent: membershipEmailTemplate({
          firstName: request.firstName,
          requestedLevel: request.requestedLevel,
          requestedDepartment: request.requestedDepartment,
          requestedRole: request.requestedRole,
        }),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Demande d’adhésion soumise avec succès.',
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la demande d'adhésion.",
      error: error.message,
    });
  }
}

module.exports = {
  createMembershipRequest,
};