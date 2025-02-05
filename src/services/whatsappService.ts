import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConnection {
  id: string;
  bot_id: string | null;
  phone_number: string | null;
  status: "disconnected" | "connecting" | "connected";
  session_data: any;
  created_at: string;
  updated_at: string;
  qr_code: string | null;
  qr_code_timestamp: string | null;
}

class WhatsAppService {
  async getConnections(botId: string): Promise<WhatsAppConnection[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('bot_id', botId);

      if (error) throw error;
      
      return data || [];
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
      return data;
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

  async initializeWhatsApp(connectionId: string): Promise<void> {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get authentication session');
      }

      if (!session) {
        console.error('No active session');
        throw new Error('No active session found. Please log in again.');
      }

      console.log('Session found, initializing WhatsApp...');
      
      const { error: functionError } = await supabase.functions.invoke('whatsapp-init', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (functionError) {
        console.error('Error initializing WhatsApp:', functionError);
        throw functionError;
      }
    } catch (error) {
      console.error('Error in initializeWhatsApp:', error);
      throw error;
    }
  }

  async getQRCode(connectionId: string): Promise<string | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp-qr', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;
      return data?.qrCode || null;
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();