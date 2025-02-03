type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private API_URL: string;

  constructor() {
    // Get the Supabase URL from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('VITE_SUPABASE_URL is not defined');
      throw new Error('VITE_SUPABASE_URL is not defined');
    }
    this.API_URL = supabaseUrl;
  }

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      const response = await fetch(`${this.API_URL}/functions/v1/whatsapp-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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
      const response = await fetch(`${this.API_URL}/functions/v1/whatsapp-qr`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
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