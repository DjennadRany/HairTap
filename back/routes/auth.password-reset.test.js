import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';

const sendPasswordResetEmailMock = jest.fn();

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock
}));

const authRouter = (await import('./auth.js')).default;

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
});

afterEach(async () => {
  jest.clearAllMocks();
  await PasswordResetToken.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

const extractTokenFromEmail = () => {
  const resetUrl = sendPasswordResetEmailMock.mock.calls.at(-1)?.[0].resetUrl;
  return resetUrl ? new URL(resetUrl).searchParams.get('token') : null;
};

describe('Password reset flow', () => {
  it('stores a token and sends an email when requesting a reset', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    });

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' })
      .expect(200);

    expect(response.body.message).toContain('lien de réinitialisation');
    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);

    const resetUrl = sendPasswordResetEmailMock.mock.calls[0][0].resetUrl;
    expect(resetUrl).toContain('/reset-password?token=');

    const tokens = await PasswordResetToken.find({ user: user._id });
    expect(tokens).toHaveLength(1);
  });

  it('allows resetting the password with a valid token and rejects reuse', async () => {
    const user = await User.create({
      name: 'Resettable User',
      email: 'reset@example.com',
      password: 'Password123!'
    });

    await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });

    const token = extractTokenFromEmail();
    expect(token).toBeTruthy();

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassword456!' })
      .expect(200);

    expect(resetResponse.body.message).toContain('réinitialisé');

    const updatedUser = await User.findById(user._id).select('+password');
    expect(await bcrypt.compare('NewPassword456!', updatedUser.password)).toBe(true);

    const storedToken = await PasswordResetToken.findOne({ user: user._id });
    expect(storedToken?.consumedAt).toBeInstanceOf(Date);

    const reuseAttempt = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'AnotherPass789!' });

    expect(reuseAttempt.status).toBe(400);
  });

  it('rejects reset attempts with expired database tokens', async () => {
    const user = await User.create({
      name: 'Expired User',
      email: 'expired@example.com',
      password: 'Password123!'
    });

    const tokenId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
    const expiresAt = new Date(Date.now() - 1000);

    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

    const jwtToken = jwt.sign(
      { tokenId, sub: user._id.toString(), type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: jwtToken, password: 'AnotherPass789!' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('invalide');
  });
});
