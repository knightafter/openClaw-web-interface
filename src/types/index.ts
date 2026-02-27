export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ConnectionConfig {
  apiUrl: string;
  token: string;
  sessionKey?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

// Open Claw Protocol types
export interface OCRequestFrame {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
}

export interface OCResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: any;
  error?: { code: string; message: string; details?: unknown };
}

export interface OCEventFrame {
  type: 'event';
  event: string;
  payload?: any;
  seq?: number;
}

export type OCFrame = OCRequestFrame | OCResponseFrame | OCEventFrame;

export interface OCChatPayload {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final' | 'aborted' | 'error';
  message?: {
    role: string;
    content: Array<{ type: string; text: string }>;
    timestamp: number;
  };
  errorMessage?: string;
}
