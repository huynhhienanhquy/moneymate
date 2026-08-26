import React from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAiChat } from '@/hooks/components/useAiChat';

const AiChatWidget: React.FC = () => {
  const { open, setOpen, input, setInput, messages, suggestions, bottomRef, send, isSending } = useAiChat();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 transition-all hover:scale-105"
        title="MoneyMate AI Chat"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-brand-600/10">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-400" />
              <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">MoneyMate AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8">
                <Sparkles size={32} className="mx-auto mb-3 text-brand-400 opacity-60" />
                <p>Xin chào! Tôi có thể giúp bạn phân tích tài chính.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {(suggestions.length ? suggestions : [
                    'Tháng này tôi chi nhiều nhất ở đâu?',
                    'Tôi có vượt ngân sách không?',
                  ]).map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-brand-500/30 text-brand-400 hover:bg-brand-500/10">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800">
                  <Loader2 size={16} className="animate-spin text-brand-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Hỏi về tài chính của bạn..."
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button onClick={send} disabled={!input.trim() || isSending}
                className="p-2 rounded-lg bg-brand-600 text-white disabled:opacity-50 hover:bg-brand-500">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;
