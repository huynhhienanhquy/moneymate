import { render, screen } from '@/test/render';
import { TransactionTools } from './TransactionTools';
import { deleteTransactionToolDefinition, updateTransactionToolDefinition } from './transactionToolDefinitions';

const mocks = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('@copilotkit/react-core/v2', () => ({ useHumanInTheLoop: mocks.register }));

describe('Copilot transaction tools', () => {
  beforeEach(() => mocks.register.mockClear());

  it('registers update and deletion as confirmation tools without automatic write handlers', () => {
    render(<TransactionTools />);
    expect(mocks.register.mock.calls.map(([tool]) => tool.name)).toEqual(['updateTransaction', 'deleteTransaction']);
    for (const [tool] of mocks.register.mock.calls) {
      expect(tool.agentId).toBe('default');
      expect(tool.handler).toBeUndefined();
      expect(tool.render).toBeTypeOf('function');
    }
  });

  it('rejects invented IDs, nonpositive amounts and transfer updates, but permits clearing a note', () => {
    const transactionId = '11111111-1111-4111-8111-111111111111';
    expect(deleteTransactionToolDefinition.parameters.safeParse({ transactionId: 'unknown' }).success).toBe(false);
    expect(updateTransactionToolDefinition.parameters.safeParse({ transactionId, amount: 0 }).success).toBe(false);
    expect(updateTransactionToolDefinition.parameters.safeParse({ transactionId, type: 'TRANSFER' }).success).toBe(false);
    expect(updateTransactionToolDefinition.parameters.safeParse({ transactionId, note: '' }).success).toBe(true);
  });

  it('only displays successful completion for a valid receipt with the matching action', () => {
    render(<TransactionTools />);
    const View = mocks.register.mock.calls[1][0].render;
    render(<View status="complete" result='{"success":true,"action":"updateTransaction","transactionId":"tx-1"}' />);
    expect(screen.getByText('Thao tác chưa hoàn tất.')).toBeInTheDocument();
  });
});
