import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConnection {
  id: string;
  bot_id: string;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  session_data: any;
  created_at: string;
  updated_at: string;
}

class WhatsAppService {
  async initialize(botId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User must be authenticated to initialize WhatsApp');
      }

      const response = await supabase.functions.invoke('whatsapp-init', {
        body: { botId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
      throw error;
    }
  }

  async getQRCode(connectionId: string): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User must be authenticated to get QR code');
      }
      
      const response = await supabase.functions.invoke('whatsapp-qr', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
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

  async getConnections(botId: string): Promise<WhatsAppConnection[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('bot_id', botId);

      if (error) throw error;
      
      // Ensure the status is one of the allowed values
      return data.map(conn => ({
        ...conn,
        status: (conn.status as 'disconnected' | 'connecting' | 'connected') || 'disconnected'
      }));
    } catch (error) {
      console.error('Failed to get WhatsApp connections:', error);
      throw error;
    }
  }

  async createConnection(botId: string): Promise<WhatsAppConnection> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert([{ 
          bot_id: botId,
          status: 'disconnected' as const
        }])
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConnection;
    } catch (error) {
      console.error('Failed to create WhatsApp connection:', error);
      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete WhatsApp connection:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();