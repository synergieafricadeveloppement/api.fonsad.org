const baseTemplate = require('./baseTemplate');

function membershipEmailTemplate({ firstName, requestedLevel, requestedDepartment, requestedRole }) {
  return baseTemplate({
    title: 'Demande d’adhésion reçue',
    subtitle: 'Votre dossier a bien été enregistré',
    contentHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:26px;color:#102418;">
        Bonjour <strong>${firstName}</strong>,
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:26px;color:#4B6350;">
        Votre demande d’adhésion FONSAD a bien été reçue et sera analysée par notre équipe.
      </p>

      <div style="background:#F8FBF8;border:1px solid rgba(10,154,73,0.10);border-radius:18px;padding:16px 18px;">
        <div style="font-size:14px;line-height:24px;color:#102418;"><strong>Niveau :</strong> ${requestedLevel}</div>
        <div style="font-size:14px;line-height:24px;color:#102418;"><strong>Département :</strong> ${requestedDepartment}</div>
        <div style="font-size:14px;line-height:24px;color:#102418;"><strong>Rôle :</strong> ${requestedRole}</div>
      </div>
    `,
  });
}

module.exports = membershipEmailTemplate;