import {
  createBudgetToolDefinition,
  createCategoryToolDefinition,
  createRecurringToolDefinition,
  createSavingGoalToolDefinition,
  createWalletToolDefinition,
  recordIncomeToolDefinition,
  transferFundsToolDefinition,
} from './actionToolDefinitions';

describe('CopilotKit data mutation tool definitions', () => {
  it('registers distinct action names', () => {
    expect([
      createCategoryToolDefinition.name,
      createWalletToolDefinition.name,
      createBudgetToolDefinition.name,
      createSavingGoalToolDefinition.name,
      createRecurringToolDefinition.name,
      recordIncomeToolDefinition.name,
      transferFundsToolDefinition.name,
    ]).toEqual([
      'createCategory',
      'createWallet',
      'createBudget',
      'createSavingGoal',
      'createRecurringTransaction',
      'recordIncome',
      'transferFunds',
    ]);
  });

  it('accepts a complete recurring transaction draft', () => {
    expect(
      createRecurringToolDefinition.parameters.safeParse({
        amount: 250_000,
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        walletName: 'Ngân hàng',
        categoryName: 'Hóa đơn',
        note: 'Internet',
        startDate: '2026-10-03',
      }).success,
    ).toBe(true);
  });

  it('rejects unsafe or incomplete financial drafts', () => {
    expect(
      createRecurringToolDefinition.parameters.safeParse({
        amount: -1,
        type: 'EXPENSE',
        frequency: 'SOMETIMES',
        walletName: '',
        categoryName: '',
        note: '',
        startDate: 'tomorrow',
      }).success,
    ).toBe(false);

    expect(
      transferFundsToolDefinition.parameters.safeParse({
        sourceWalletName: 'Ví A',
        destinationWalletName: 'Ví B',
        amount: 0,
        note: '',
        date: '2026-10-03',
      }).success,
    ).toBe(false);
  });
});
