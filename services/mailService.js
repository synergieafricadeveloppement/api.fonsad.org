// services/mailService.js

async function sendMail({ to, subject, htmlContent }) {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY manquante, email non envoyé');
      return null;
    }

    const mailFromRaw = String(process.env.MAIL_FROM || '').trim();
    const senderEmailMatch = mailFromRaw.match(/<(.+)>/);
    const senderEmail = senderEmailMatch ? senderEmailMatch[1].trim() : 'no-reply@fonsad.org';
    const senderName = senderEmailMatch
      ? mailFromRaw.split('<')[0].trim() || 'FONSAD'
      : 'FONSAD';

    const recipients = (Array.isArray(to) ? to : [to])
      .map((email) => String(email || '').trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    if (!recipients.length) {
      throw new Error('Aucun destinataire email valide fourni.');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: recipients,
        subject,
        htmlContent,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Brevo error:', data);
      throw new Error(data?.message || "Erreur Brevo lors de l'envoi de l'email.");
    }

    return data;
  } catch (error) {
    console.error('sendMail error:', error.message);
    throw error;
  }
}

module.exports = {
  sendMail,
};