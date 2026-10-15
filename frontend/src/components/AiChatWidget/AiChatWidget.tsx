import AppInput from '@/components/common/AppInput/AppInput';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useRef } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';
import { useAnimatedPresence } from '@/hooks/useAnimatedPresence';

/**
 * Render the ai chat widget interface.
 *
 * Use it to keep the ai chat widget workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered ai chat widget interface.
 */
const AiChatWidget: React.FC = () => {
  const { open, setOpen, input, setInput, messages, suggestions, bottomRef, send, isSending } = useAiChat();
  const { isPresent, motionState } = useAnimatedPresence(open);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  return (
    <>
      <AppButton unstyled
        ref={launcherRef}
        aria-label="Mở trò chuyện MoneyMate AI"
        aria-expanded={open}
        aria-controls={open ? 'ai-chat-panel' : undefined}
        onClick={() => setOpen(true)}
        className="app-chat-launcher fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700"
        title="MoneyMate AI Chat"
      >
        <Bot className="size-6" />
      </AppButton>

      {isPresent && (
        <div id="ai-chat-panel" role="dialog" aria-label="MoneyMate AI" data-state={motionState}
          aria-hidden={!open || undefined} {...(!open ? { inert: '' } : {})}
          onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); closeChat(); } }}
          className="app-chat-panel fixed bottom-24 right-6 z-50 w-chat-width max-w-chat-viewport h-chat-height max-h-[calc(100dvh-7.5rem)] flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-brand-600/10">
            <div className="flex items-center gap-2">
              <Sparkles  className="size-4.5 text-brand-400" />
              <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">MoneyMate AI</span>
            </div>
            <AppButton unstyled aria-label="Đóng trò chuyện" onClick={closeChat} className="app-icon-button min-h-8 min-w-8"><X className="size-4.5" /></AppButton>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8">
                <Sparkles  className="size-8 mx-auto mb-3 text-brand-400 opacity-60" />
                <p>Xin chào! Tôi có thể giúp bạn phân tích tài chính.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {(suggestions.length ? suggestions : [
                    'Tháng này tôi chi nhiều nhất ở đâu?',
                    'Tôi có vượt ngân sách không?',
                  ]).map((s) => (
                    <AppButton unstyled key={s} onClick={() => setInput(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-brand-500/30 text-brand-400 hover:bg-brand-500/10">
                      {s}
                    </AppButton>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`app-chat-message flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-chat-message px-3 py-2 rounded-xl text-sm ${m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800">
                  <Loader2  className="size-4 animate-spin text-brand-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-slate-800">
            <div className="flex gap-2">
              <AppInput unstyled
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Hỏi về tài chính của bạn..."
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <AppButton unstyled onClick={send} disabled={!input.trim() || isSending}
                className="p-2 rounded-lg bg-brand-600 text-white disabled:opacity-50 hover:bg-brand-500">
                <Send className="size-4" />
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;
