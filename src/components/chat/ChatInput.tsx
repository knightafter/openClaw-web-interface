'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    // Collapsed: 1 line (~44px). Expanded: up to 160px
    el.style.height = `${Math.min(scrollH, 160)}px`;
  }, [message, focused]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset height after clear
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const expanded = focused || message.length > 0;

  return (
    <div
      className={`
        glass rounded-2xl border transition-all duration-300 
        ${expanded
          ? 'border-brand-300 dark:border-brand-500/40 shadow-lg shadow-brand-500/10'
          : 'border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700'
        }
        bg-white/90 dark:bg-neutral-900/70
      `}
    >
      <div className="flex items-end gap-2 p-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Message Open Claw..."
          disabled={disabled}
          rows={1}
          className={`
            flex-1 resize-none bg-transparent px-3 py-2.5 text-sm
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400 dark:placeholder:text-neutral-600
            focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200
          `}
          style={{ minHeight: '40px', maxHeight: '160px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`
            flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            transition-all duration-200 cursor-pointer active:scale-90
            ${message.trim() && !disabled
              ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/25'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            }
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
