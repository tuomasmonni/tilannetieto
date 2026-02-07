/**
 * AI Data Analyst - React Hook
 * Handles SSE connection, message management, and artifact collection
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, Artifact, SSEEvent } from './types';

interface UseAnalystChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  activeTools: Map<string, string>; // toolUseId -> toolName
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

export function useAnalystChat(): UseAnalystChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<Map<string, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      // Abort any ongoing request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        artifacts: [],
        toolsUsed: [],
        timestamp: new Date(),
      };

      // Build conversation history for the API
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);
      setActiveTools(new Map());

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        artifacts: [],
        toolsUsed: [],
        timestamp: new Date(),
      };

      // Add placeholder for assistant
      setMessages([...newMessages, assistantMessage]);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch('/api/ai/analyst', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages
              .filter((m) => m.content.trim() !== '')
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event: SSEEvent = JSON.parse(jsonStr);
              handleSSEEvent(
                event,
                assistantMessage,
                newMessages,
                setMessages,
                setActiveTools,
                setIsLoading
              );
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;

        // Update assistant message with error
        assistantMessage.content +=
          '\n\nVirhe: Analyysin suorittaminen epäonnistui. Yritä uudelleen.';
        setMessages([...newMessages, { ...assistantMessage }]);
      } finally {
        setIsLoading(false);
        setActiveTools(new Map());
        abortRef.current = null;
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
    setActiveTools(new Map());
  }, []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages };
}

function handleSSEEvent(
  event: SSEEvent,
  assistantMsg: ChatMessage,
  userMessages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setActiveTools: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  switch (event.type) {
    case 'text':
      assistantMsg.content += event.text;
      setMessages([...userMessages, { ...assistantMsg }]);
      break;

    case 'tool_start':
      assistantMsg.toolsUsed.push(event.tool);
      setActiveTools((prev) => new Map(prev).set(event.toolUseId, event.tool));
      setMessages([...userMessages, { ...assistantMsg }]);
      break;

    case 'tool_end':
      setActiveTools((prev) => {
        const next = new Map(prev);
        next.delete(event.toolUseId);
        return next;
      });
      break;

    case 'artifact':
      assistantMsg.artifacts.push(event.artifact);
      setMessages([...userMessages, { ...assistantMsg }]);
      break;

    case 'error':
      assistantMsg.content += `\n\n_Virhe: ${event.error}_`;
      setMessages([...userMessages, { ...assistantMsg }]);
      break;

    case 'done':
      setIsLoading(false);
      break;
  }
}
