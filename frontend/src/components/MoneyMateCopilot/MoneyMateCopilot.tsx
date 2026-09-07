import { CopilotPopup, type CopilotChatLabels } from '@copilotkit/react-core/v2';
import AiChatWidget from '@/components/AiChatWidget/AiChatWidget';
import { useMoneyMateCopilotStatus } from '@/contexts/MoneyMateCopilotProvider';

const VIETNAMESE_LABELS: Partial<CopilotChatLabels> = {
  modalHeaderTitle: 'Trợ lý MoneyMate',
  welcomeMessageText: 'Xin chào! Tôi giúp bạn quản lý tài chính cá nhân và ghi khoản chi. Ví dụ: hôm nay ăn uống hết 12 đ. Bạn sẽ kiểm tra và xác nhận trước khi lưu.',
  chatInputPlaceholder: 'Hỏi MoneyMate hoặc nhập khoản chi của bạn...',
  chatDisclaimerText: 'MoneyMate AI chỉ cung cấp thông tin tham khảo, không phải tư vấn tài chính.',
  chatToggleOpenLabel: 'Mở trợ lý MoneyMate',
  chatToggleCloseLabel: 'Đóng trợ lý MoneyMate',
  chatInputToolbarStartTranscribeButtonLabel: 'Bắt đầu nhập bằng giọng nói',
  chatInputToolbarCancelTranscribeButtonLabel: 'Hủy nhập bằng giọng nói',
  chatInputToolbarFinishTranscribeButtonLabel: 'Hoàn tất nhập bằng giọng nói',
  chatInputToolbarAddButtonLabel: 'Đính kèm',
  chatInputToolbarToolsButtonLabel: 'Công cụ',
  assistantMessageToolbarCopyCodeLabel: 'Sao chép mã',
  assistantMessageToolbarCopyCodeCopiedLabel: 'Đã sao chép',
  assistantMessageToolbarCopyMessageLabel: 'Sao chép câu trả lời',
  assistantMessageToolbarInspectorLabel: 'Kiểm tra hoạt động',
  assistantMessageToolbarInspectorLocalOnlyLabel: 'Chỉ có trong môi trường phát triển',
  assistantMessageToolbarThumbsUpLabel: 'Câu trả lời hữu ích',
  assistantMessageToolbarThumbsDownLabel: 'Câu trả lời chưa hữu ích',
  assistantMessageToolbarReadAloudLabel: 'Đọc câu trả lời',
  assistantMessageToolbarRegenerateLabel: 'Tạo lại câu trả lời',
  userMessageToolbarCopyMessageLabel: 'Sao chép câu hỏi',
  userMessageToolbarEditMessageLabel: 'Sửa câu hỏi',
};

export const MoneyMateCopilot = () => {
  const { mode, errorMessage } = useMoneyMateCopilotStatus();

  if (mode === 'fallback') return <AiChatWidget />;
  if (mode === 'waiting') return null;

  return (
    <div className="moneymate-copilot">
      {errorMessage && (
        <div className="moneymate-copilot__error" role="alert">
          {errorMessage}
        </div>
      )}
      <CopilotPopup
        agentId="default"
        labels={VIETNAMESE_LABELS}
        defaultOpen={false}
        clickOutsideToClose
      />
    </div>
  );
};

export default MoneyMateCopilot;
