import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_SMTP_URL,
  EMAIL_SECURE,
  EMAIL_ENABLED,
  NODE_ENV
} = process.env;

let transporterPromise;
let nodemailerModulePromise;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDirectory = path.join(__dirname, '..', 'templates', 'emails');
const templateCache = new Map();

const templateDefinitions = {
  passwordReset: {
    subject: 'Réinitialisation de votre mot de passe TapHair',
    html: 'password-reset.html',
    text: 'password-reset.txt'
  },
  bookingConfirmation: {
    subject: 'Votre réservation TapHair est confirmée',
    html: 'booking-confirmation.html',
    text: 'booking-confirmation.txt'
  },
  bookingReminder: {
    subject: 'Rappel : votre rendez-vous TapHair',
    html: 'booking-reminder.html',
    text: 'booking-reminder.txt'
  },
  bookingCancellation: {
    subject: 'Confirmation d\'annulation de rendez-vous',
    html: 'booking-cancellation.html',
    text: 'booking-cancellation.txt'
  }
};

const createJsonTransporter = (reason) => ({
  options: { jsonTransport: true, reason },
  async sendMail(message) {
    console.info('📧 Email simulé (service email désactivé):', {
      to: message.to,
      subject: message.subject,
      reason
    });

    return {
      accepted: message.to ? (Array.isArray(message.to) ? message.to : [message.to]) : [],
      rejected: [],
      response: `Email service disabled (${reason})`,
      messageId: 'simulated-message-id',
      message
    };
  }
});

const isExplicitlyEnabled = () => {
  if (typeof EMAIL_ENABLED !== 'string') return false;
  const normalized = EMAIL_ENABLED.trim().toLowerCase();
  if (['true', '1', 'on', 'enable', 'enabled', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'off', 'disable', 'disabled', 'no'].includes(normalized)) return false;
  return false;
};

const shouldUseRealTransport = () => {
  if (NODE_ENV === 'development' && !isExplicitlyEnabled()) {
    return false;
  }

  if (isExplicitlyEnabled()) {
    return true;
  }

  return Boolean(EMAIL_SMTP_URL || (EMAIL_HOST && EMAIL_PORT));
};

const loadNodemailer = async () => {
  if (!nodemailerModulePromise) {
    nodemailerModulePromise = import('nodemailer')
      .then((module) => module.default ?? module)
      .catch((error) => {
        console.warn(
          'Nodemailer non disponible. Installez la dépendance via "npm install" dans le dossier back pour activer l\'envoi réel.',
          error
        );

        return null;
      });
  }

  return nodemailerModulePromise;
};

const createTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (!shouldUseRealTransport()) {
        return createJsonTransporter('disabled');
      }

      const nodemailer = await loadNodemailer();

      if (!nodemailer) {
        return createJsonTransporter('nodemailer-unavailable');
      }

      if (EMAIL_SMTP_URL) {
        return nodemailer.createTransport(EMAIL_SMTP_URL);
      }

      if (EMAIL_HOST && EMAIL_PORT) {
        const port = Number(EMAIL_PORT);

        return nodemailer.createTransport({
          host: EMAIL_HOST,
          port,
          secure: EMAIL_SECURE ? EMAIL_SECURE === 'true' || EMAIL_SECURE === '1' : port === 465,
          auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined
        });
      }

      return createJsonTransporter('missing-configuration');
    })();
  }

  return transporterPromise;
};

const loadTemplateFile = async (fileName) => {
  const filePath = path.join(templatesDirectory, fileName);
  return fs.readFile(filePath, 'utf-8');
};

const loadTemplate = async (templateKey) => {
  if (templateCache.has(templateKey)) {
    return templateCache.get(templateKey);
  }

  const definition = templateDefinitions[templateKey];
  if (!definition) {
    throw new Error(`Template inconnu : ${templateKey}`);
  }

  const [html, text] = await Promise.all([
    definition.html ? loadTemplateFile(definition.html) : Promise.resolve(null),
    definition.text ? loadTemplateFile(definition.text) : Promise.resolve(null)
  ]);

  const template = { ...definition, html, text };
  templateCache.set(templateKey, template);
  return template;
};

const renderTemplate = (content, data) => {
  if (!content) return null;
  return content.replace(/{{\s*(\w+)\s*}}/g, (_, key) => (data?.[key] ?? ''));
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
    console.info('ℹ️  Email non envoyé (mode simulation). Configurez un SMTP et définissez EMAIL_ENABLED=true pour activer l\'envoi.');
  }

  return info;
};

const sendTemplateEmail = async (templateKey, { to, data }) => {
  const template = await loadTemplate(templateKey);
  return sendEmail({
    to,
    subject: renderTemplate(template.subject, data),
    text: renderTemplate(template.text, data),
    html: renderTemplate(template.html, data)
  });
};

export const sendPasswordResetEmail = async ({ email, resetUrl, expiresInMinutes = 60 }) => {
  return sendTemplateEmail('passwordReset', {
    to: email,
    data: {
      resetUrl,
      expiresInMinutes
    }
  });
};

export const sendBookingConfirmationEmail = async ({ email, userName, bookingDate, bookingTime, serviceName }) => {
  return sendTemplateEmail('bookingConfirmation', {
    to: email,
    data: { userName, bookingDate, bookingTime, serviceName }
  });
};

export const sendBookingReminderEmail = async ({ email, userName, bookingDate, bookingTime, serviceName }) => {
  return sendTemplateEmail('bookingReminder', {
    to: email,
    data: { userName, bookingDate, bookingTime, serviceName }
  });
};

export const sendBookingCancellationEmail = async ({ email, userName, bookingDate, bookingTime, serviceName, reason }) => {
  return sendTemplateEmail('bookingCancellation', {
    to: email,
    data: { userName, bookingDate, bookingTime, serviceName, reason }
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendBookingCancellationEmail
};
