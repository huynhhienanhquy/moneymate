import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { ExpenseConfirmation } from './ExpenseConfirmation';
import { expenseToolDefinition } from './expenseToolDefinition';

/**
 * Render the expense tool interface.
 *
 * Use it to keep the expense tool workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered expense tool interface.
 */
export function ExpenseTool() {
  useHumanInTheLoop({
    ...expenseToolDefinition,
    agentId: 'default',
    /**
     * Render the confirmation UI for a requested expense transaction.
     *
     * Use it to keep the expense tool workflow's presentation and interactions in one reusable UI boundary.
     * @param props - The properties that configure this React component.
     * @returns The resulting expense tool value for the caller.
     */
    render: ({ args, status, respond, result, toolCallId }) => {
      if (status === 'inProgress') return <p role="status">Đang chuẩn bị khoản chi...</p>;
      if (status === 'executing' && respond) return <ExpenseConfirmation key={toolCallId} draft={args} toolCallId={toolCallId} respond={respond} />;
      let saved = false;
      try {
        const response = JSON.parse(result || '{}');
        saved = response.success === true && typeof response.transactionId === 'string' && response.transactionId.length > 0;
      } catch { /* A malformed result is never a successful save. */ }
      return <p role="status">{saved ? 'Đã lưu khoản chi.' : 'Đã hủy, không lưu khoản chi.'}</p>;
    },
  }, []);
  return null;
}
