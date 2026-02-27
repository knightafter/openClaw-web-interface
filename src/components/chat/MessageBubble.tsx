'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.isError === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start gap-2.5 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold ${
            isUser
              ? 'bg-brand-500 text-white'
              : isError
                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'
          }`}
        >
          {isUser ? '👤' : isError ? '⚠️' : '🤖'}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-brand-500 text-white rounded-tr-sm'
                : isError
                  ? 'bg-red-950/40 text-red-200 rounded-tl-sm border border-red-800/50'
                  : 'bg-neutral-800/80 text-neutral-100 rounded-tl-sm border border-transparent'
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      return isInline ? (
                        <code
                          className="bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className={`block bg-neutral-950 text-neutral-100 p-3 rounded-lg overflow-x-auto ${className}`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                    a: ({ children, href }) => (
                      <a href={href} className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <span className={`text-xs text-neutral-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {isStreaming ? (
              <span className="inline-flex items-center text-brand-500">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse mr-1" />
                streaming...
              </span>
            ) : (
              formatTime(message.timestamp)
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
