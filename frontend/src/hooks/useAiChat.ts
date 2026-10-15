import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api/client';
import { useReducedMotion } from './useReducedMotion';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Provide ai chat state and actions to React consumers.
 *
 * Use it in React components that need use ai chat behavior.
 * @returns The current ai chat state and the actions that operate on it.
 */
export const useAiChat = () => {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    /**
     * Execute the use ai chat mutation requested by the client.
     *
     * Use it in React components that need use ai chat behavior.
     * @param payload - The input data required to execute the use ai chat mutation requested by the client.
     * @returns The resulting use ai chat value for the caller.
     */
    mutationFn: (payload: { message: string; history: Omit<ChatMessage, 'id'>[] }) =>
      api.post('/ai/chat', payload).then((response) => response.data.data),
    /**
     * Finalize the use ai chat workflow after a successful operation.
     *
     * Use it in React components that need use ai chat behavior.
     * @param data - The input data required to finalize the use ai chat workflow after a successful operation.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: (data) => {
      const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.reply };
      setMessages((previous) => [...previous, reply]);
      if (data.suggestions) setSuggestions(data.suggestions);
    },
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages, chatMutation.isPending, open, reducedMotion]);

  /**
   * Send use ai chat through the use ai chat boundary.
   *
   * Use it in React components that need use ai chat behavior.
   * @returns Nothing; the operation is complete when the function returns.
   */
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
