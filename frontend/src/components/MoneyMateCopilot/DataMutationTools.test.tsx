import { render, screen } from '@/test/render';
import { DataMutationTools } from './DataMutationTools';

const mocks = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock('@copilotkit/react-core/v2', () => ({
  useHumanInTheLoop: mocks.register,
}));

describe('DataMutationTools', () => {
  beforeEach(() => {
    mocks.register.mockClear();
  });

  it('registers every write action as a human-in-the-loop tool', () => {
    render(<DataMutationTools />);

    expect(mocks.register.mock.calls.map(([tool]) => tool.name)).toEqual([
      'createCategory',
      'createWallet',
      'createBudget',
      'createSavingGoal',
      'createRecurringTransaction',
      'recordIncome',
      'transferFunds',
    ]);
    for (const [tool] of mocks.register.mock.calls) {
      expect(tool.agentId).toBe('default');
      expect(tool.handler).toBeUndefined();
      expect(tool.render).toBeTypeOf('function');
    }
  });

  it('only reports success from a successful tool receipt', () => {
    render(<DataMutationTools />);
    const recurringTool = mocks.register.mock.calls.find(
      ([tool]) => tool.name === 'createRecurringTransaction',
    )?.[0];
    const View = recurringTool.render;

    render(
      <View
        status="complete"
        result='{"success":true,"recurringId":"rec-1"}'
      />,
    );
    expect(screen.getByText('Đã tạo giao dịch định kỳ.')).toBeInTheDocument();

    render(
      <View status="complete" result='{"success":false,"cancelled":true}' />,
    );
    expect(screen.getByText('Đã hủy thao tác.')).toBeInTheDocument();
  });
});
