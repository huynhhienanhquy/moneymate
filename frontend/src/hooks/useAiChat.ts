import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const useAiChat = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (payload: { message: string; history: Omit<ChatMessage, 'id'>[] }) =>
      api.post('/ai/chat', payload).then((response) => response.data.data),
    onSuccess: (data) => {
      const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.reply };
      setMessages((previous) => [...previous, reply]);
      if (data.suggestions) setSuggestions(data.suggestions);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const send = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages((previous) => [...previous, userMessage]);
    chatMutation.mutate({ message: userMessage.content, history: messages.map(({ role, content }) => ({ role, content })) });
    setInput('');
  };

  return {
    open,
    setOpen,
    input,
    setInput,
    messages,
    suggestions,
    bottomRef,
    send,
    isSending: chatMutation.isPending,
  };
};
