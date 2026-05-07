export function otpEmailTemplate({ title, intro, code, minutes = 10 }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f7faf5; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid rgba(10,154,73,0.10);">
        <h2 style="margin: 0 0 12px; color: #102418;">${title}</h2>
        <p style="margin: 0 0 16px; color: #5C6F61; line-height: 1.6;">${intro}</p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; background: #F7FFF9; color: #0A9A49; border: 1px solid rgba(10,154,73,0.12); border-radius: 14px; padding: 16px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px;">
            ${code}
          </div>
        </div>
        <p style="margin: 0; color: #4B6350; line-height: 1.6;">
          Ce code expire dans ${minutes} minutes.
        </p>
      </div>
    </div>
  `;
}