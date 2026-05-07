function baseTemplate({ title, subtitle, contentHtml }) {
  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#F7FAF5;font-family:Arial,Helvetica,sans-serif;color:#102418;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7FAF5;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid rgba(10,154,73,0.10);">
              <tr>
                <td style="background:linear-gradient(135deg,#0A9A49 0%,#0E7D3F 100%);padding:28px 28px 22px;">
                  <div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#F3D24F;text-transform:uppercase;">FONSAD</div>
                  <div style="font-size:28px;line-height:34px;font-weight:800;color:#FFFFFF;margin-top:8px;">${title}</div>
                  <div style="font-size:15px;line-height:24px;color:rgba(255,255,255,0.84);margin-top:10px;">${subtitle}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  ${contentHtml}
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 28px;">
                  <div style="background:#F8FBF8;border:1px solid rgba(10,154,73,0.10);border-radius:18px;padding:16px 18px;">
                    <div style="font-size:14px;line-height:22px;color:#4B6350;">
                      Fondation Synergie Africa Développement / RDC
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 28px;">
                  <div style="font-size:12px;line-height:20px;color:#5C6F61;text-align:center;">
                    Email automatique FONSAD. Merci de ne pas répondre directement à ce message.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

module.exports = baseTemplate;