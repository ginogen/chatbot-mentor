import { supabase } from "@/integrations/supabase/client";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class WhatsAppService {
  private connectionStatus: ConnectionStatus = 'disconnected';

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be authenticated to initialize WhatsApp');
      }

      console.log('Initializing WhatsApp with authenticated session');
      
      const response = await supabase.functions.invoke('whatsapp-init', {
        body: { action: 'initialize' }
      });

      if (response.error) {
        throw response.error;
      }
      
      this.connectionStatus = 'connected';
      return response.data;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error('WhatsApp initialization error:', error);
      throw error;
    }
  }

  async getQRCode(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User must be authenticated to get QR code');
      }

      console.log('Fetching QR code with authenticated session');
      
      const response = await supabase.functions.invoke('whatsapp-qr', {
        body: { action: 'getQR' }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data.qrCode;
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