import dotenv from 'dotenv';

dotenv.config();

const splitEmails = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'FONSAD <no-reply@fonsad.org>',
  clientUrl: process.env.CLIENT_URL || '',
  adminNotificationEmails: [
    process.env.ADMIN_NOTIFICATION_EMAIL,
    process.env.ADMINNOTIFICATIONEMAIL,
    ...splitEmails(process.env.ADMIN_NOTIF_EMAILS),
  ].filter(Boolean),
};