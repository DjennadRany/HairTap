import { jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

jest.setTimeout(30000);
