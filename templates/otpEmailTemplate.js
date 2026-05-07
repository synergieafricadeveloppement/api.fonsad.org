const baseTemplate = require('./baseTemplate');

function otpEmailTemplate({ title, intro, code, minutes }) {
  return baseTemplate({
    title,
    subtitle: 'Validation sécurisée par code OTP',
    contentHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:26px;color:#102418;">
        ${intro}
      </p>

      <div style="margin:26px 0;text-align:center;">
        <div style="display:inline-block;background:#F7FFF9;border:1px solid rgba(10,154,73,0.14);border-radius:20px;padding:18px 26px;color:#0A9A49;font-size:34px;line-height:38px;font-weight:900;letter-spacing:10px;">
          ${code}
        </div>
      </div>

      <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#4B6350;">
        Ce code expire dans <strong style="color:#102418;">${minutes} minutes</strong>.
      </p>

      <p style="margin:0;font-size:14px;line-height:23px;color:#5C6F61;">
        Si vous n’êtes pas à l’origine de cette action, vous pouvez ignorer cet email.
      </p>
    `,
  });
}

module.exports = otpEmailTemplate;