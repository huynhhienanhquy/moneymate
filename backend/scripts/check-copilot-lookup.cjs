// Optional live provider check. All transaction data is synthetic; no database writes.
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.COPILOTKIT_TELEMETRY_DISABLED = 'true';
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env'), quiet: true });
require('ts-node/register');
const { randomUUID } = require('node:crypto');
const { BuiltInAgent } = require('@copilotkit/runtime/v2');
const { getCopilotKitConfig } = require('../src/config/copilotkit');
const { buildFinancialTools } = require('../src/copilotkit/financial-tools');
const { MONEY_MATE_COPILOT_PROMPT } = require('../src/copilotkit/prompt');
const prisma = require('../src/config/db').default;
const { AppError } = require('../src/common/app-error');
const config = getCopilotKitConfig();
// The SDK logs entire failed requests; keep this diagnostic safe and concise.
console.error = error => console.log(JSON.stringify({ sdkError: error?.name ?? 'Error', code: error?.code }));
const now = new Date();
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const fixtures = [
  { id: '11111111-1111-4111-8111-111111111111', amount: '120000', note: 'Bữa trưa mẫu' },
  { id: '22222222-2222-4222-8222-222222222222', amount: '85000', note: 'Bữa tối mẫu' },
].map(transaction => ({ ...transaction, type: 'EXPENSE', version: 1,
  transactionDate: new Date(`${localDate}T00:00:00.000Z`),
  wallet: { name: 'Ví thử nghiệm' }, category: { name: 'Ăn uống' },
}));

async function runCase(label, transactions) {
  const logs = [];
  const calls = [];
  const unexpected = async () => { throw new Error('Unexpected aggregate request'); };
  const tools = buildFinancialTools('copilot-lookup-synthetic', {
    logger: { info: event => logs.push(event), error: event => logs.push(event) },
  }, {
    contextBuilder: { build: unexpected }, budgetService: { getBudgets: unexpected }, savingGoalService: { getGoals: unexpected },
    transactionService: {
      getMonthlyReport: unexpected,
      getTransactions: async userId => {
        if (userId !== 'copilot-lookup-synthetic') throw new Error('Wrong scope');
        return { transactions, pagination: { total: transactions.length } };
      },
      getTransaction: async () => { throw new AppError('Transaction not found', 404); },
    },
  });
  for (const tool of tools) {
    const execute = tool.execute;
    tool.execute = async args => {
      calls.push({ name: tool.name, args });
      return execute(args);
    };
  }
  const agent = new BuiltInAgent({
    model: config.model, apiKey: config.openaiApiKey,
    prompt: MONEY_MATE_COPILOT_PROMPT, tools,
    maxSteps: config.maxSteps, maxOutputTokens: 600, maxRetries: 1, temperature: 0.3,
  });
  let reply = '';
  let failed = false;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { agent.abortRun(); reject(new Error('Model timeout')); }, 50000);
    agent.run({
      threadId: randomUUID(), runId: randomUUID(), state: {}, forwardedProps: {}, tools: [],
      messages: [{ id: randomUUID(), role: 'user', content: 'Tìm khoản chi ăn uống gần đây để tôi chọn giao dịch cần sửa.' }],
      context: [{ description: 'Current local application date', value: JSON.stringify({ localDate, timeZone: 'Asia/Bangkok' }) }],
    }).subscribe({
      next: event => {
        if (['TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_CHUNK'].includes(event.type)) reply += event.delta ?? '';
        if (event.type === 'RUN_ERROR') failed = true;
      },
      error: error => { clearTimeout(timer); reject(error); },
      complete: () => { clearTimeout(timer); resolve(); },
    });
  });
  const successfulLookup = logs.some(log => log.toolName === 'findTransactions' && log.success);
  const guessedId = calls.some(call => call.name === 'findTransactions' && call.args.transactionId != null);
  const outageReply = /không khả dụng|tạm thời không|temporarily unavailable/i.test(reply);
  if (failed || !successfulLookup || guessedId || !reply || outageReply) throw new Error(`Lookup regression: ${label}`);
  console.log(JSON.stringify({ case: label, calls, reply, passed: true }));
}

(async () => {
  try {
    await runCase('empty list', []);
    await runCase('two matching transactions', fixtures);
  } catch (error) {
    console.log(JSON.stringify({ error: error.name, message: error.message }));
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
})();
