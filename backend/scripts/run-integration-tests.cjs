const net = require('node:net');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env.test') });

const canReachDatabase = async () => {
  if (!process.env.DATABASE_URL) return false;

  let databaseUrl;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL);
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
    });
    const finish = (reachable) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
};

const main = async () => {
  const databaseAvailable = await canReachDatabase();
  const databaseRequired = process.env.REQUIRE_DATABASE_INTEGRATION === 'true' || process.env.CI === 'true';
  const jestArgs = [
    '--experimental-vm-modules',
    require.resolve('jest/bin/jest'),
    '--config',
    'jest.integration.config.cjs',
    '--runInBand',
  ];

  if (!databaseAvailable) {
    if (databaseRequired) {
      console.error('MySQL test database is required but unavailable; refusing to skip database integration tests.');
      process.exit(1);
    }
    console.warn('MySQL test database is unavailable; running database-independent integration tests only.');
    jestArgs.push('--testPathIgnorePatterns=auth.api.test.ts');
  }

  const result = spawnSync(process.execPath, jestArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
};

void main();
