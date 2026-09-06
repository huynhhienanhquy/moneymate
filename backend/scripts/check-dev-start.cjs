const { spawn } = require('node:child_process');
const path = require('node:path');

const port = Number(process.env.DEV_STARTUP_CHECK_PORT || 5099);
const timeoutMs = Number(process.env.DEV_STARTUP_CHECK_TIMEOUT_MS || 60_000);
const tsNodeRegister = require.resolve('ts-node/register');
const child = spawn(process.execPath, ['-r', tsNodeRegister, 'src/server.ts'], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let finished = false;

const appendOutput = (chunk) => {
  const text = String(chunk);
  output += text;
  process.stdout.write(text);
};

child.stdout.on('data', appendOutput);
child.stderr.on('data', appendOutput);

const stop = (exitCode) => {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
  process.exitCode = exitCode;
};

const timeout = setTimeout(() => {
  console.error(`Development server did not become healthy within ${timeoutMs}ms.`);
  stop(1);
}, timeoutMs);

child.once('exit', (code) => {
  if (!finished) {
    console.error(`Development server exited before the health check passed (code ${code ?? 'unknown'}).`);
    if (output) console.error('See server output above.');
    stop(1);
  }
});

child.once('error', (error) => {
  console.error(`Unable to start development server: ${error.message}`);
  stop(1);
});

const checkHealth = async () => {
  while (!finished) {
    try {
      // Do not accidentally accept a healthy, unrelated process on this port.
      if (!output.includes(`MoneyMate API Server running on port ${port}`)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        const body = await response.json();
        if (body?.status === 'ok') {
          console.log('Development server startup check passed.');
          stop(0);
          return;
        }
      }
    } catch {
      // Server compilation/startup is still in progress.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
};

void checkHealth();
