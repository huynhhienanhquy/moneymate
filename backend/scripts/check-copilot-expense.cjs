// Optional live smoke check: uses a synthetic message, never saves a transaction.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Module, createRequire } = require('node:module');
const ts = require('typescript');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('ts-node/register');

// Load the exact frontend tool schema, including its own Zod version.
const definitionPath = path.resolve(__dirname, '../../frontend/src/components/MoneyMateCopilot/expenseToolDefinition.ts');
const definitionModule = new Module(definitionPath, module);
definitionModule.filename = definitionPath;
definitionModule.paths = Module._nodeModulePaths(path.dirname(definitionPath));
definitionModule._compile(ts.transpileModule(fs.readFileSync(definitionPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, definitionPath);
const { expenseToolDefinition } = definitionModule.exports;
const { z } = createRequire(definitionPath)('zod');
const { buildMoneyMateAgent } = require('../src/copilotkit/financial-agent');
const { getCopilotKitConfig } = require('../src/config/copilotkit');
const prisma = require('../src/config/db').default;

const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const agent = buildMoneyMateAgent({ id: 'copilot-smoke-no-data', email: 'smoke@example.invalid', role: 'USER' }, {
  ...getCopilotKitConfig(), maxSteps: 1,
});
const calls = [];
let failed = false;
const timer = setTimeout(() => { agent.abortRun(); process.exitCode = 1; }, 60_000);
const finish = async () => {
  clearTimeout(timer);
  await prisma.$disconnect();
};
agent.run({
  threadId: randomUUID(), runId: randomUUID(), state: {}, forwardedProps: {},
  messages: [{ id: randomUUID(), role: 'user', content: 'hôm nay ăn uống hết 12 đ' }],
  context: [{ description: 'Current local application date', value: JSON.stringify({ localDate, timeZone: 'Asia/Bangkok' }) }],
  tools: [{ name: expenseToolDefinition.name, description: expenseToolDefinition.description, parameters: z.toJSONSchema(expenseToolDefinition.parameters) }],
}).subscribe({
  next: (event) => {
    if (event.type === 'TOOL_CALL_START') calls.push({ id: event.toolCallId, name: event.toolCallName, args: '' });
    if (event.type === 'TOOL_CALL_ARGS') {
      const call = calls.find(item => item.id === event.toolCallId);
      if (call) call.args += event.delta;
    }
    if (event.type === 'RUN_ERROR') { failed = true; console.error('Agent run failed:', event.code || 'RUN_ERROR'); }
  },
  error: (error) => {
    console.error('Live expense check failed:', error.name, error.code || 'UNKNOWN');
    process.exitCode = 1;
    void finish();
  },
  complete: () => {
    const call = calls.find(item => item.name === 'recordExpense');
    let args;
    try { args = expenseToolDefinition.parameters.parse(JSON.parse(call?.args || '{}')); } catch { failed = true; }
    if (failed || args?.amount !== 12 || args?.date !== localDate || args?.walletName !== '') {
      console.error('Agent did not produce the expected expense draft.');
      process.exitCode = 1;
    } else {
      console.log('PASS: recordExpense requested for 12 VND on the local date, awaiting user wallet selection and confirmation. No transaction was saved.');
    }
    void finish();
  },
});
