type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';
  private API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      const response = await fetch(`${this.API_URL}/whatsapp/init`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize WhatsApp');
      }
      
      this.connectionStatus = 'connected';
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  async getQRCode(): Promise<string> {
    try {
      const response = await fetch(`${this.API_URL}/whatsapp/qr`);
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
}

export const whatsappService = new WhatsAppService();