import { render, screen } from '@/test/render';
import { ExpenseTool } from './ExpenseTool';

const mocks = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('@copilotkit/react-core/v2', () => ({ useHumanInTheLoop: mocks.register }));
vi.mock('./ExpenseConfirmation', () => ({ ExpenseConfirmation: ({ draft }: { draft: { amount: number } }) => <div>Kiểm tra {draft.amount} đ</div> }));

it('registers a confirmation tool and distinguishes a draft from a persisted expense', () => {
  render(<ExpenseTool />);
  const tool = mocks.register.mock.calls[0][0];
  expect(tool.name).toBe('recordExpense');
  expect(tool.agentId).toBe('default');
  expect(tool.handler).toBeUndefined();
  const draft = { amount: 12, categoryName: 'Ăn uống', walletName: '', note: '', date: '' };
  expect(tool.parameters.parse(draft).amount).toBe(12);
  expect(tool.parameters.safeParse({ ...draft, amount: -12 }).success).toBe(false);
  expect(tool.parameters.safeParse({ ...draft, amount: undefined }).success).toBe(true);
  const View = tool.render;
  render(<View status="executing" args={draft} toolCallId="one" respond={vi.fn()} />);
  expect(screen.getByText('Kiểm tra 12 đ')).toBeInTheDocument();
  expect(screen.queryByText('Đã lưu khoản chi.')).not.toBeInTheDocument();
  render(<View status="complete" args={draft} result='{"success":true,"transactionId":"tx-1"}' />);
  expect(screen.getByText('Đã lưu khoản chi.')).toBeInTheDocument();
});
