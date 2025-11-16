import { jest } from '@jest/globals';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

const setupService = async (env = {}) => {
  jest.resetModules();
  mockSendMail.mockReset();
  mockCreateTransport.mockReset();
  Object.assign(process.env, env);

  jest.unstable_mockModule(
    'nodemailer',
    () => ({
      default: {
        createTransport: mockCreateTransport
      }
    }),
    { virtual: true }
  );

  return import('../services/emailService.js');
};

describe('emailService', () => {
  test('utilise le transport JSON en mode développement sans activation explicite', async () => {
    const { sendEmail } = await setupService({
      NODE_ENV: 'development',
      EMAIL_ENABLED: 'false'
    });

    const result = await sendEmail({
      to: 'dev@example.com',
      subject: 'Test',
      text: 'Hello dev'
    });

    expect(result.messageId).toBe('simulated-message-id');
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  test('envoie un email de réinitialisation avec le contenu du template', async () => {
    const { sendPasswordResetEmail } = await setupService({
      EMAIL_ENABLED: 'false',
      EMAIL_SMTP_URL: 'smtp://localhost',
      EMAIL_FROM: 'no-reply@example.com'
    });

    const resetUrl = 'https://example.com/reset?token=abc';
    const result = await sendPasswordResetEmail({ email: 'user@example.com', resetUrl, expiresInMinutes: 30 });

    expect(result.message.html).toContain(resetUrl);
    expect(result.message.text).toContain('30 minutes');
  });

  test('utilise le template d\'annulation avec le motif fourni', async () => {
    const { sendBookingCancellationEmail } = await setupService({
      EMAIL_ENABLED: 'false',
      EMAIL_SMTP_URL: 'smtp://localhost'
    });

    const result = await sendBookingCancellationEmail({
      email: 'client@example.com',
      userName: 'Client Test',
      bookingDate: '01/01/2025',
      bookingTime: '10:00',
      serviceName: 'Brushing',
      reason: 'Coiffeur indisponible'
    });

    expect(result.message.text).toContain('Coiffeur indisponible');
    expect(result.message.html).toContain('Brushing');
  });
});
