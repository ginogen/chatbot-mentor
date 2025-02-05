import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface WhatsAppConnection {
  id: string;
  bot_id: string | null;
  phone_number: string | null;
  status: "disconnected" | "connecting" | "connected";
  session_data: Json | null;
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
      
      // Ensure the status is one of the allowed values
      return (data || []).map(conn => ({
        ...conn,
        status: this.normalizeStatus(conn.status)
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
      
      return {
        ...data,
        status: this.normalizeStatus(data.status)
      };
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

  private normalizeStatus(status: string): WhatsAppConnection['status'] {
    const validStatuses: WhatsAppConnection['status'][] = ['disconnected', 'connecting', 'connected'];
    return validStatuses.includes(status as WhatsAppConnection['status']) 
      ? status as WhatsAppConnection['status']
      : 'disconnected';
  }
}

export const whatsappService = new WhatsAppService();