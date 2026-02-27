import { Message } from '@/types';

export class HttpClient {
  private apiUrl: string = '';
  private apiKey?: string;
  private pollingInterval?: NodeJS.Timeout;

  onMessage: ((message: Message) => void) | null = null;
  onStatusChange: ((status: 'connected' | 'disconnected' | 'error') => void) | null = null;

  async connect(apiUrl: string, apiKey?: string): Promise<void> {
    this.apiUrl = apiUrl.replace(/^ws/, 'http'); // Convert ws:// to http://
    this.apiKey = apiKey;

    try {
      // Test connection with a ping
      const response = await fetch(`${this.apiUrl}/health`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      });

      if (response.ok) {
        this.onStatusChange?.('connected');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      this.onStatusChange?.('error');
      throw error;
    }
  }

  async sendMessage(content: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          message: content,
          text: content,
          content: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (this.onMessage) {
        const message: Message = {
          id: data.id || Date.now().toString(),
          role: 'assistant',
          content: data.content || data.message || data.text || data.response,
          timestamp: new Date(data.timestamp || Date.now()),
        };
        this.onMessage(message);
      }
    } catch (error) {
      console.error('Error sending HTTP message:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.onStatusChange?.('disconnected');
  }
}
