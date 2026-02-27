import { Message, OCFrame, OCResponseFrame, OCEventFrame, OCChatPayload } from '@/types';

function uuid(): string {
  return crypto.randomUUID();
}

/** Default timeout for RPC requests (ms) */
const REQUEST_TIMEOUT_MS = 30_000;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private apiUrl: string = '';
  private token: string = '';
  private sessionKey: string = 'agent:main:web';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingRequests = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer?: ReturnType<typeof setTimeout> }>();
  private connected = false;

  // Current streaming state
  private currentRunId: string | null = null;
  private streamBuffer: string = '';
  private receivedDeltaForRun = new Map<string, boolean>(); // Track if we got deltas for each runId

  // Challenge-response handshake
  private challengeResolver: ((payload: { nonce: string; ts: number }) => void) | null = null;

  onMessage: ((message: Message) => void) | null = null;
  onDelta: ((runId: string, fullText: string) => void) | null = null;
  onError: ((errorMessage: string) => void) | null = null;
  onStatusChange: ((status: 'connected' | 'disconnected' | 'error') => void) | null = null;

  connect(apiUrl: string, token: string, sessionKey?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.apiUrl = apiUrl;
        this.token = token;
        if (sessionKey) this.sessionKey = sessionKey;

        let wsUrl = apiUrl;
        if (apiUrl.startsWith('http://')) wsUrl = apiUrl.replace('http://', 'ws://');
        else if (apiUrl.startsWith('https://')) wsUrl = apiUrl.replace('https://', 'wss://');
        else if (!apiUrl.startsWith('ws://') && !apiUrl.startsWith('wss://')) wsUrl = 'ws://' + apiUrl;

        console.log('[OC] Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        const connectTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
          this.ws?.close();
        }, 10000);

        this.ws.onopen = () => {
          console.log('[OC] WebSocket open, waiting for server challenge...');

          // The server sends a connect.challenge event first.
          // Wait for it, then send the connect handshake.
          // Fallback: if no challenge in 3 seconds, send connect directly.
          const fallbackTimer = setTimeout(() => {
            console.log('[OC] No challenge received within 3 s — sending connect without challenge');
            this.challengeResolver = null;
            this.performConnect(connectTimeout, resolve, reject);
          }, 3000);

          this.challengeResolver = (payload) => {
            clearTimeout(fallbackTimer);
            this.challengeResolver = null;
            console.log('[OC] Received connect.challenge, now sending connect handshake');
            this.performConnect(connectTimeout, resolve, reject);
          };
        };

        this.ws.onmessage = (event) => {
          try {
            const frame: OCFrame = JSON.parse(event.data);
            this.handleFrame(frame);
          } catch (error) {
            console.error('[OC] Parse error:', error, event.data);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          console.error('[OC] WebSocket error:', error);
          this.onStatusChange?.('error');
          if (!this.connected) reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = (event) => {
          console.log('[OC] WebSocket closed:', event.code, event.reason);
          const wasConnected = this.connected;
          this.connected = false;
          this.challengeResolver = null;
          this.flushPending(new Error('Connection closed'));

          // Auth errors (1008 + "unauthorized") should NOT reconnect — bad token won't magically fix itself
          const reason = event.reason || '';
          const isAuthError = event.code === 1008 && reason.toLowerCase().includes('unauthorized');

          if (isAuthError) {
            console.error('[OC] Auth error — not reconnecting. Check your gateway token.');
            this.onStatusChange?.('error');
            this.onError?.('**Authentication failed** — Your gateway token is invalid. Check `~/.openclaw/openclaw.json` for the correct token, then refresh the page.');
          } else {
            this.onStatusChange?.('disconnected');
            if (wasConnected) {
              // Only reconnect if we had a successful connection before
              this.attemptReconnect();
            }
          }
        };
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Perform the actual connect handshake.
   * Called either after receiving a connect.challenge or after the fallback timeout.
   */
  private performConnect(
    connectTimeout: ReturnType<typeof setTimeout>,
    resolve: () => void,
    reject: (err: Error) => void,
  ): void {
    this.sendConnectHandshake()
      .then(() => {
        clearTimeout(connectTimeout);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onStatusChange?.('connected');
        console.log('[OC] Connected successfully!');
        resolve();
      })
      .catch((err) => {
        clearTimeout(connectTimeout);
        console.error('[OC] Handshake failed:', err);
        reject(err);
      });
  }

  private sendConnectHandshake(): Promise<any> {
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'webchat-ui',
        version: 'dev',
        platform: 'web',
        mode: 'webchat',
      },
      role: 'operator',
      scopes: ['operator.admin'],
      auth: {
        token: this.token,
      },
    };
    return this.requestRaw('connect', params);
  }

  /**
   * Low-level request that ONLY checks the WebSocket is open (no `this.connected` guard).
   * Used exclusively for the connect handshake.
   */
  private requestRaw(method: string, params?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error(`Cannot send ${method} - WebSocket not open (readyState: ${this.ws?.readyState})`));
        return;
      }
      const id = uuid();
      const frame = { type: 'req' as const, id, method, params };
      console.log('[OC] Sending request:', method, id);
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);
      this.pendingRequests.set(id, { resolve, reject, timer });
      this.send(frame);
    });
  }

  private request(method: string, params?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        const error = new Error(`Cannot send ${method} - WebSocket not connected`);
        console.error('[OC]', error.message, 'connected:', this.connected, 'ws:', !!this.ws, 'readyState:', this.ws?.readyState);
        reject(error);
        return;
      }
      
      const id = uuid();
      const frame = { type: 'req' as const, id, method, params };
      console.log('[OC] Sending request:', method, id);
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);
      this.pendingRequests.set(id, { resolve, reject, timer });
      this.send(frame);
    });
  }

  private handleFrame(frame: OCFrame): void {
    console.log('[OC] Frame:', frame.type, frame.type === 'event' ? (frame as OCEventFrame).event : '', frame);
    if (frame.type === 'res') {
      this.handleResponse(frame as OCResponseFrame);
    } else if (frame.type === 'event') {
      this.handleEvent(frame as OCEventFrame);
    }
  }

  private handleResponse(frame: OCResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) return;
    this.pendingRequests.delete(frame.id);
    if (pending.timer) clearTimeout(pending.timer);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      pending.reject(new Error(frame.error?.message ?? 'Unknown error'));
    }
  }

  private handleEvent(frame: OCEventFrame): void {
    if (frame.event === 'connect.challenge') {
      // Server challenge — route to pending resolver if we're still in the connect phase
      if (this.challengeResolver) {
        this.challengeResolver(frame.payload as { nonce: string; ts: number });
      } else {
        console.log('[OC] connect.challenge received (already connected, ignoring)');
      }
    } else if (frame.event === 'chat') {
      this.handleChatEvent(frame.payload as OCChatPayload);
    } else if (frame.event === 'tick') {
      // Server heartbeat, ignore
    } else if (frame.event === 'agent') {
      this.handleAgentEvent(frame.payload);
    } else {
      console.log('[OC] Event:', frame.event, frame.payload);
    }
  }

  private handleAgentEvent(payload: any): void {
    // Agent lifecycle events — extract errors if present
    const phase = payload?.phase ?? payload?.lifecycle;
    console.log('[OC] Agent event:', phase, payload);

    if (phase === 'error' || phase === 'failed') {
      const errorMsg = payload?.error?.message ?? payload?.errorMessage ?? payload?.error ?? 'Agent encountered an error';
      console.error('[OC] Agent error:', errorMsg);
      this.onError?.(String(errorMsg));
    }
  }

  /**
   * Extract text from a chat payload, handling multiple shapes:
   *  - message.content: [{ type: 'text', text: '...' }]   (OpenAI-style)
   *  - message.content: "plain string"
   *  - message.text: "..."
   *  - message.body: "..."
   *  - text / body / content at top level of payload
   */
  private extractText(payload: any): string {
    const msg = payload?.message;

    // 1) message.content is an array of parts (OpenAI-style)
    if (Array.isArray(msg?.content)) {
      const parts = msg.content
        .filter((c: any) => c.type === 'text' || typeof c === 'string')
        .map((c: any) => (typeof c === 'string' ? c : c.text))
        .filter(Boolean);
      if (parts.length > 0) return parts.join('');
    }

    // 2) message.content is a plain string
    if (typeof msg?.content === 'string' && msg.content) return msg.content;

    // 3) message.text
    if (typeof msg?.text === 'string' && msg.text) return msg.text;

    // 4) message.body
    if (typeof msg?.body === 'string' && msg.body) return msg.body;

    // 5) Top-level payload fields
    if (typeof payload?.text === 'string' && payload.text) return payload.text;
    if (typeof payload?.content === 'string' && payload.content) return payload.content;
    if (typeof payload?.body === 'string' && payload.body) return payload.body;

    return '';
  }

  private handleChatEvent(payload: OCChatPayload): void {
    console.log('[OC] Chat event:', payload.state, 'runId:', payload.runId, 'raw payload:', JSON.stringify(payload).substring(0, 500));
    
    // Extract text from multiple possible payload shapes
    const text = this.extractText(payload);

    switch (payload.state) {
      case 'delta':
        this.currentRunId = payload.runId;
        this.receivedDeltaForRun.set(payload.runId, true); // Mark that we received a delta for this run
        this.streamBuffer = text; // Gateway sends full accumulated text in each delta
        this.onDelta?.(payload.runId, text);
        break;

      case 'final': {
        const finalText = text || this.streamBuffer;
        const hadDeltas = this.receivedDeltaForRun.get(payload.runId) ?? false;
        console.log('[OC] Final text:', finalText ? finalText.substring(0, 100) + '...' : '(empty)', 'hadDeltas:', hadDeltas);
        
        this.currentRunId = null;
        this.streamBuffer = '';
        this.receivedDeltaForRun.delete(payload.runId); // Clean up tracking
        
        if (finalText) {
          // We have text (either from message or accumulated deltas)
          this.onMessage?.({
            id: payload.runId,
            role: 'assistant',
            content: finalText,
            timestamp: new Date(payload.message?.timestamp ?? Date.now()),
          });
        } else if (!hadDeltas) {
          // No text AND no deltas received — action-only task or tool use
          // Always send placeholder to clear typing state
          this.onMessage?.({
            id: payload.runId ?? `done-${Date.now()}`,
            role: 'assistant',
            content: '*Task completed.*',
            timestamp: new Date(payload.message?.timestamp ?? Date.now()),
          });
        } else {
          // Had deltas but final has no additional text — just clear typing state
          // Send empty message to trigger clearTypingState callback without leaving typing indicator
          console.log('[OC] Clearing typing state after streaming completion');
          // Emit a final message with current streamBuffer content if any
          // But first check if streamBuffer has any content
          // If there's accumulated content from deltas, it was already shown
          // Just trigger the callback with a marker or empty message
          // Actually, better to send the final streamed content as a message
          // This ensures the final state is captured
          if (this.streamBuffer) {
            this.onMessage?.({
              id: payload.runId,
              role: 'assistant',
              content: this.streamBuffer,
              timestamp: new Date(payload.message?.timestamp ?? Date.now()),
            });
          } else {
            // No content at all - still need to clear typing
            // Send an empty/whitespace message just to trigger callbacks
            this.onMessage?.({
              id: payload.runId ?? `done-${Date.now()}`,
              role: 'assistant',
              content: '',
              timestamp: new Date(payload.message?.timestamp ?? Date.now()),
            });
          }
        }
        break;
      }

      case 'error': {
        this.currentRunId = null;
        this.streamBuffer = '';
        const errMsg = payload.errorMessage ?? 'Unknown error';
        console.error('[OC] Chat error:', errMsg);
        // Parse common error patterns for user-friendly messages
        const friendlyError = this.formatLLMError(errMsg);
        if (this.onMessage) {
          this.onMessage({
            id: payload.runId ?? `error-${Date.now()}`,
            role: 'assistant',
            content: friendlyError,
            timestamp: new Date(),
            isError: true,
          });
        }
        break;
      }

      case 'aborted':
        this.currentRunId = null;
        this.streamBuffer = '';
        break;
    }
  }

  private send(data: any): void {
    if (!this.ws) {
      console.error('[OC] WebSocket not initialized');
      return;
    }
    
    const readyState = this.ws.readyState;
    if (readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      const stateMap: Record<number, string> = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED',
      };
      console.error(`[OC] WebSocket is ${stateMap[readyState]} (state ${readyState}), cannot send`);
      
      // Reject any pending requests
      if (data.type === 'req' && data.id) {
        const pending = this.pendingRequests.get(data.id);
        if (pending) {
          pending.reject(new Error(`Connection not ready (state: ${stateMap[readyState]})`));
          this.pendingRequests.delete(data.id);
        }
      }
    }
  }

  /**
   * Parse raw LLM error messages into user-friendly descriptions
   */
  private formatLLMError(raw: string): string {
    const lower = raw.toLowerCase();

    if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota') || lower.includes('resource_exhausted')) {
      return '**Rate limit exceeded** — The AI model\'s free tier quota has been reached. Please wait a minute and try again, or switch to a different API key/model.';
    }
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('api_key_invalid')) {
      return '**Authentication error** — The API key is invalid or expired. Please check your model configuration.';
    }
    if (lower.includes('500') || lower.includes('internal server error') || lower.includes('internal_error')) {
      return '**Server error** — The AI provider is having issues. Please try again in a moment.';
    }
    if (lower.includes('timeout') || lower.includes('deadline')) {
      return '**Timeout** — The AI model took too long to respond. Try a shorter message or try again.';
    }
    if (lower.includes('context') && (lower.includes('overflow') || lower.includes('too long') || lower.includes('exceeded'))) {
      return '**Context too long** — The conversation is too long for the model. Try starting a new chat.';
    }

    return `**Error:** ${raw}`;
  }

  /** Public method — call any gateway method from outside */
  call(method: string, params?: unknown): Promise<any> {
    return this.request(method, params);
  }

  sendMessage(content: string): void {
    if (!this.connected) {
      console.error('[OC] sendMessage called but not connected — connected:', this.connected, 'ws:', !!this.ws, 'readyState:', this.ws?.readyState);
      this.onError?.('**Connection lost** — Please wait while we reconnect or refresh the page.');
      return;
    }

    const params = {
      sessionKey: this.sessionKey,
      message: content,
      idempotencyKey: uuid(),
    };
    console.log('[OC] Sending chat.send:', JSON.stringify(params));
    this.request('chat.send', params)
      .then((res) => console.log('[OC] ✓ chat.send accepted by server:', res))
      .catch((err) => {
        console.error('[OC] ✗ chat.send failed:', err);
        const errorMsg = err.message || 'Failed to send message';
        if (errorMsg.includes('not connected') || errorMsg.includes('not ready') || errorMsg.includes('timed out')) {
          this.onError?.('**Connection lost** — Please wait while we reconnect or refresh the page.');
        } else {
          this.onError?.(errorMsg);
        }
      });
  }

  async loadHistory(): Promise<Message[]> {
    try {
      const result = await this.request('chat.history', {
        sessionKey: this.sessionKey,
        limit: 50,
      });
      console.log('[OC] History loaded:', result);
      return []; // We'll parse history if needed later
    } catch (err) {
      console.log('[OC] No history or error loading:', err);
      return [];
    }
  }

  disconnect(): void {
    this.connected = false;
    this.flushPending(new Error('Disconnected'));
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private flushPending(error: Error): void {
    for (const [, p] of this.pendingRequests) {
      if (p.timer) clearTimeout(p.timer);
      p.reject(error);
    }
    this.pendingRequests.clear();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`[OC] Reconnecting... Attempt ${this.reconnectAttempts} in ${delay}ms`);
      setTimeout(() => {
        this.connect(this.apiUrl, this.token, this.sessionKey).catch((err) => {
          console.error('[OC] Reconnect failed:', err);
          // If it's an auth error propagated through connect(), stop trying
          const msg = (err?.message || '').toLowerCase();
          if (msg.includes('unauthorized') || msg.includes('token mismatch')) {
            console.error('[OC] Auth error on reconnect — giving up.');
            this.onStatusChange?.('error');
            this.onError?.('**Authentication failed** — Your gateway token is invalid. Check `~/.openclaw/openclaw.json` for the correct token, then refresh the page.');
          }
        });
      }, delay);
    } else {
      console.error('[OC] Max reconnect attempts reached. Giving up.');
      this.onStatusChange?.('error');
      this.onError?.('**Connection lost** — Could not reconnect after multiple attempts. Please refresh the page.');
    }
  }
}
