const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['api-key'];

if (process.env.BREVO_API_KEY) {
  apiKey.apiKey = process.env.BREVO_API_KEY;
}

async function sendMail({ to, subject, htmlContent }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY manquante, email non envoyé');
    return null;
  }

  const senderEmailMatch = String(process.env.MAIL_FROM || '').match(/<(.+)>/);
  const senderEmail = senderEmailMatch ? senderEmailMatch[1] : 'no-reply@fonsad.org';
  const senderName =
    String(process.env.MAIL_FROM || '').split('<')[0].trim() || 'FONSAD';

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = {
    name: senderName,
    email: senderEmail,
  };
  sendSmtpEmail.to = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

  return apiInstance.sendTransacEmail(sendSmtpEmail);
}

module.exports = {
  sendMail,
};