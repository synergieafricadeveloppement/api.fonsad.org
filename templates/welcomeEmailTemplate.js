const baseTemplate = require('./baseTemplate');

function welcomeEmailTemplate({ firstName }) {
  return baseTemplate({
    title: 'Bienvenue sur FONSAD',
    subtitle: 'Votre compte a été activé avec succès',
    contentHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:26px;color:#102418;">
        Bonjour <strong>${firstName}</strong>,
      </p>

      <p style="margin:0 0 14px;font-size:15px;line-height:26px;color:#4B6350;">
        Votre compte FONSAD a été créé et validé avec succès.
      </p>

      <div style="margin-top:20px;background:#FFF9E9;border:1px solid rgba(243,210,79,0.35);border-radius:18px;padding:16px 18px;">
        <div style="font-size:14px;line-height:22px;color:#5C6F61;">
          Vous pouvez maintenant accéder aux espaces de gestion, d’adhésion, RH, finances et autres modules selon votre profil.
        </div>
      </div>
    `,
  });
}

module.exports = welcomeEmailTemplate;