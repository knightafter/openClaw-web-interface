'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { MessageBubble } from './MessageBubble';

export function MessageList({ streamingText }: { streamingText?: string | null }) {
  const { messages, isTyping } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingText]);

  return (
    <div className="p-4 space-y-4 bg-transparent">
      {messages.length === 0 && !streamingText ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-xl font-semibold text-neutral-100 mb-2">
            Start a conversation
          </h3>
          <p className="text-neutral-500">
            Send a message to begin chatting with Open Claw
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Show streaming text as it arrives */}
          {streamingText && (
            <MessageBubble
              message={{
                id: '_streaming',
                role: 'assistant',
                content: streamingText,
                timestamp: new Date(),
              }}
              isStreaming
            />
          )}
          
          {/* Show typing indicator when waiting for first delta */}
          {isTyping && !streamingText && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm">
                🤖
              </div>
              <div className="bg-neutral-800/80 border border-transparent rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
