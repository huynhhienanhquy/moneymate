import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });
process.env.COPILOTKIT_TELEMETRY_DISABLED ??= 'true';

// Global test timeout
jest.setTimeout(30000);
