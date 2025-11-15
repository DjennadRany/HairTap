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
let nodemailerModulePromise;

const loadNodemailer = () => {
  if (!nodemailerModulePromise) {
    nodemailerModulePromise = import('nodemailer')
      .then((module) => module.default ?? module)
      .catch((error) => {
        console.warn('Nodemailer non disponible, bascule vers un transport simulé.', error);
        return null;
      });
  }

  return nodemailerModulePromise;
};

const createTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  const nodemailer = await loadNodemailer();

  if (nodemailer) {
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
  }

  transporter = {
    options: { jsonTransport: true, reason: 'nodemailer-unavailable' },
    // Mimic nodemailer API to keep the rest of the app untouched
    async sendMail(message) {
      console.info('📧 Email simulé (nodemailer manquant) :', {
        to: message.to,
        subject: message.subject
      });

      return {
        accepted: [message.to],
        rejected: [],
        response: 'Simulated email because nodemailer is unavailable',
        messageId: 'simulated-message-id'
      };
    }
  };

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const activeTransporter = await createTransporter();
  const info = await activeTransporter.sendMail({
    from: EMAIL_FROM || 'TapHair <no-reply@taphair.com>',
    to,
    subject,
    text,
    html
  });

  if (activeTransporter.options?.jsonTransport) {
    console.info('📧 Email simulé (mode jsonTransport):', info.message ?? info);
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
