import { useState } from 'react';
import {
  CopilotChat,
  type CopilotChatLabels,
} from '@copilotkit/react-core/v2';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import AppButton from '@/components/common/AppButton/AppButton';

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

export const CopilotAiChatWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppButton
        unstyled
        onClick={() => setOpen(true)}
        className="moneymate-copilot__launcher"
        title="MoneyMate AI Chat"
        aria-label="Mở trợ lý MoneyMate"
        aria-expanded={open}
        aria-controls="moneymate-copilot-chat"
      >
        <MessageCircle className="size-6" />
        <span aria-hidden="true" />
      </AppButton>

      {open && (
        <section
          id="moneymate-copilot-chat"
          role="dialog"
          aria-label="Trợ lý MoneyMate"
          className="moneymate-copilot__panel"
        >
          <header className="moneymate-copilot__header">
            <div className="moneymate-copilot__brand-mark" aria-hidden="true">
              <Sparkles className="size-4.5" />
            </div>
            <div className="moneymate-copilot__heading">
              <span>MoneyMate AI</span>
              <small><i aria-hidden="true" /> Trợ lý tài chính cá nhân</small>
            </div>
            <AppButton
              unstyled
              onClick={() => setOpen(false)}
              className="moneymate-copilot__close"
              aria-label="Đóng trợ lý MoneyMate"
            >
              <X className="size-4.5" />
            </AppButton>
          </header>

          <div className="min-h-0 flex-1">
            <CopilotChat
              agentId="default"
              labels={VIETNAMESE_LABELS}
              className="moneymate-copilot__chat"
            />
          </div>
        </section>
      )}
    </>
  );
};

export default CopilotAiChatWidget;
