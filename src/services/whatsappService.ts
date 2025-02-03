type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private API_URL = import.meta.env.VITE_SUPABASE_URL;

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
        throw new Error('Failed to initialize WhatsApp');
      }
      
      this.connectionStatus = 'connected';
    } catch (error) {
      this.connectionStatus = 'disconnected';
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
        throw new Error('Failed to get QR code');
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