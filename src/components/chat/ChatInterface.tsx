'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { useChatStore } from '@/stores/useChatStore';
import { WebSocketClient } from '@/lib/websocket';
import { generateId } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar/Sidebar';

// Module-level singleton to prevent duplicate connections across React strict mode re-mounts
let globalWsClient: WebSocketClient | null = null;
let globalConnectPromise: Promise<void> | null = null;

// Typing timeout — if no response in 90s, something went wrong
const TYPING_TIMEOUT_MS = 90_000;

export function ChatInterface() {
  const { config, isConnected, setConnecting, setConnected, setError } = useConnectionStore();
  const { addMessage, setTyping } = useChatStore();
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(globalWsClient);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to clear typing state and timeout
  const clearTypingState = () => {
    setTyping(false);
    setStreamingText(null);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Helper to start typing with timeout
  const startTypingWithTimeout = () => {
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      setStreamingText(null);
      addMessage({
        id: `timeout-${Date.now()}`,
        role: 'assistant',
        content: '**Request timed out** — No response received from the AI. This could be a rate limit, network issue, or the model is overloaded. Please try again.',
        timestamp: new Date(),
        isError: true,
      });
    }, TYPING_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!config) return;

    // Reuse existing connection if already connected
    if (globalWsClient) {
      // Re-attach callbacks (they may reference stale closures)
      globalWsClient.onMessage = (message) => {
        clearTypingState();
        // Don't add empty messages to history
        if (message.content.trim().length > 0) {
          addMessage(message);
        }
      };
      globalWsClient.onDelta = (_runId, fullText) => {
        setStreamingText(fullText);
      };
      globalWsClient.onError = (errorMessage) => {
        clearTypingState();
        addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          isError: true,
        });
      };
      globalWsClient.onStatusChange = (status) => {
        if (status === 'connected') setConnected(true);
        else if (status === 'disconnected') setConnected(false);
        else if (status === 'error') setError('Failed to connect to Open Claw');
      };
      setWsClient(globalWsClient);
      setConnected(true);
      return;
    }

    const client = new WebSocketClient();
    globalWsClient = client;
    setWsClient(client);

    client.onMessage = (message) => {
      clearTypingState();
      // Don't add empty messages to history
      if (message.content.trim().length > 0) {
        addMessage(message);
      }
    };

    client.onDelta = (_runId, fullText) => {
      setStreamingText(fullText);
    };

    client.onError = (errorMessage) => {
      clearTypingState();
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      });
    };

    client.onStatusChange = (status) => {
      if (status === 'connected') setConnected(true);
      else if (status === 'disconnected') {
        setConnected(false);
        // Do NOT null globalWsClient here — the WebSocketClient reconnects
        // internally and will fire 'connected' again. Nulling the reference
        // would make handleSendMessage think the client is gone.
        globalConnectPromise = null;
      }
      else if (status === 'error') setError('Failed to connect to Open Claw');
    };

    setConnecting(true);
    globalConnectPromise = client
      .connect(config.apiUrl, config.token)
      .then(() => {
        setConnected(true);
      })
      .catch((error) => {
        setError(error.message || 'Connection failed');
        globalWsClient = null;
        globalConnectPromise = null;
      });

    // Don't disconnect on unmount in dev - keep the singleton alive
    // It will be cleaned up when the connection drops or page unloads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const handleSendMessage = (content: string) => {
    if (!globalWsClient) {
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '**Connection error** — WebSocket client not initialized. Please refresh the page.',
        timestamp: new Date(),
        isError: true,
      });
      return;
    }

    if (!isConnected) {
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '**Not connected** — Please wait for the connection to establish or refresh the page.',
        timestamp: new Date(),
        isError: true,
      });
      return;
    }

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    globalWsClient.sendMessage(content);
    startTypingWithTimeout();
  };

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        wsClient={wsClient}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main chat area — shifts right when sidebar is open */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginLeft: sidebarOpen ? 280 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="flex flex-col flex-1 min-w-0 h-screen"
      >
        {/* Thin top bar with sidebar toggle */}
        <div className="flex items-center px-4 py-2 border-b border-neutral-800/40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors mr-3"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-sm text-neutral-500">Open Claw</span>
        </div>

        {/* Messages Area - Full width with scrollbar on right edge */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <MessageList streamingText={streamingText} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="max-w-4xl w-full mx-auto px-4 pb-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={!isConnected} />
        </div>
      </motion.div>
    </div>
  );
}
