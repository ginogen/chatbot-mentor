type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    // Remove trailing slash if present
    this.supabaseUrl = this.supabaseUrl.replace(/\/$/, '');
  }

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      console.log('Initializing WhatsApp with URL:', `${this.supabaseUrl}/functions/v1/whatsapp-init`);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
      console.log('Fetching QR code from:', `${this.supabaseUrl}/functions/v1/whatsapp-qr`);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/whatsapp-qr`, {
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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