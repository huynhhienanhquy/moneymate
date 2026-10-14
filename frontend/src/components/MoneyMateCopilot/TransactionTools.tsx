import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { TransactionConfirmation } from './TransactionConfirmation';
import { deleteTransactionToolDefinition, updateTransactionToolDefinition } from './transactionToolDefinitions';

function completedState(result: string | undefined, action: string, label: string) {
  try {
    const receipt = JSON.parse(result || '{}');
    if (receipt.success === true && receipt.action === action && typeof receipt.transactionId === 'string' && receipt.transactionId
      && (action !== 'deleteTransaction' || receipt.deleted === true)) return <p role="status">{label}</p>;
    if (receipt.cancelled === true) return <p role="status">Đã hủy thao tác.</p>;
  } catch { /* Invalid receipts cannot confirm a mutation. */ }
  return <p role="status">Thao tác chưa hoàn tất.</p>;
}

export function TransactionTools() {
  useHumanInTheLoop({
    ...updateTransactionToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result, toolCallId }) => {
      if (status === 'inProgress') return <p role="status">Đang chuẩn bị sửa giao dịch...</p>;
      if (status === 'executing' && respond) return <TransactionConfirmation key={toolCallId} mode="update" draft={args} toolCallId={toolCallId} respond={respond} />;
      return completedState(result, 'updateTransaction', 'Đã cập nhật giao dịch.');
    },
  }, []);
  useHumanInTheLoop({
    ...deleteTransactionToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result, toolCallId }) => {
      if (status === 'inProgress') return <p role="status">Đang chuẩn bị xóa giao dịch...</p>;
      if (status === 'executing' && respond) return <TransactionConfirmation key={toolCallId} mode="delete" draft={args} toolCallId={toolCallId} respond={respond} />;
      return completedState(result, 'deleteTransaction', 'Đã xóa giao dịch.');
    },
  }, []);
  return null;
}
