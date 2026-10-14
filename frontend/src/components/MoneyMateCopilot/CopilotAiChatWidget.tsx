import { useState } from 'react';
import {
  CopilotChat,
  type CopilotChatLabels,
} from '@copilotkit/react-core/v2';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import AppButton from '@/components/common/AppButton/AppButton';

const VIETNAMESE_LABELS: Partial<CopilotChatLabels> = {
  modalHeaderTitle: 'Trợ lý MoneyMate',
  welcomeMessageText: 'Xin chào! Tôi giúp bạn quản lý tài chính cá nhân, ghi khoản chi, sửa/xóa giao dịch và thao tác MoneyMate. Bạn có thể yêu cầu: “mở trang báo cáo”, “bật chế độ tối” hoặc “hôm nay ăn uống hết 12 đ”.',
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

/**
 * Render the copilot ai chat widget interface.
 *
 * Use it to keep the copilot ai chat widget workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered copilot ai chat widget interface.
 */
export const CopilotAiChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [threadId] = useState(() => crypto.randomUUID());

  return (
    <>
      <AppButton
        unstyled
        onClick={() => { setHasOpened(true); setOpen(true); }}
        className="moneymate-copilot__launcher"
        title="MoneyMate AI Chat"
        aria-label="Mở trợ lý MoneyMate"
        aria-expanded={open}
        aria-controls="moneymate-copilot-chat"
      >
        <MessageCircle className="size-6" />
        <span aria-hidden="true" />
      </AppButton>

      {hasOpened && (
        <section
          id="moneymate-copilot-chat"
          role="dialog"
          aria-label="Trợ lý MoneyMate"
          className="moneymate-copilot__panel"
          hidden={!open}
          style={open ? undefined : { display: 'none' }}
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
              threadId={threadId}
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
