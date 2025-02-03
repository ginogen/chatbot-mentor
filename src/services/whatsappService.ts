type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('Supabase configuration is missing');
      throw new Error('Supabase configuration is missing');
    }
  }

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize WhatsApp: ${response.statusText}`);
      }
      
      this.connectionStatus = 'connected';
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error('WhatsApp initialization error:', error);
      throw error;
    }
  }

  async getQRCode(): Promise<string> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-qr`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get QR code: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.qrCode;
    } catch (error) {
      console.error('Failed to get QR code:', error);
      throw error;
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
}

export const whatsappService = new WhatsAppService();