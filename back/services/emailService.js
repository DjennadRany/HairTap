import nodemailer from 'nodemailer';

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_SMTP_URL,
  EMAIL_SECURE
} = process.env;

let transporter;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (EMAIL_SMTP_URL) {
    transporter = nodemailer.createTransport(EMAIL_SMTP_URL);
    return transporter;
  }

  if (EMAIL_HOST && EMAIL_PORT) {
    const port = Number(EMAIL_PORT);
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port,
      secure: EMAIL_SECURE ? EMAIL_SECURE === 'true' : port === 465,
      auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const activeTransporter = createTransporter();
  const info = await activeTransporter.sendMail({
    from: EMAIL_FROM || 'TapHair <no-reply@taphair.com>',
    to,
    subject,
    text,
    html
  });

  if ('jsonTransport' in activeTransporter.options && activeTransporter.options.jsonTransport) {
    console.info('📧 Email simulé (mode jsonTransport):', info.message);
  }

  return info;
};

export const sendPasswordResetEmail = async ({ email, resetUrl, expiresInMinutes = 60 }) => {
  const text = `Vous avez demandé à réinitialiser votre mot de passe TapHair. Cliquez sur le lien suivant ou copiez-le dans votre navigateur : ${resetUrl}. Ce lien expirera dans ${expiresInMinutes} minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2933;">
      <h1 style="font-size: 20px;">Réinitialisation de votre mot de passe</h1>
      <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte TapHair.</p>
      <p>Pour choisir un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
      <p style="margin: 24px 0;">
        <a
          href="${resetUrl}"
          style="display: inline-block; background-color: #DE6C5C; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold;"
        >
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expirera dans ${expiresInMinutes} minutes.</p>
      <p style="font-size: 12px; color: #6b7280;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      <p style="margin-top: 32px;">À très vite,<br />L'équipe TapHair</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe TapHair',
    text,
    html
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail
};
