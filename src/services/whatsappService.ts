import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConnection {
  id: string;
  bot_id: string;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  session_data: any;
  created_at: string;
  updated_at: string;
  monthly_cost: number;
  whatsapp_business_phone_number: string | null;
  display_phone_number: string | null;
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
          status: 'disconnected' as const,
          monthly_cost: 0
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

  async listAvailableNumbers(): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('whatsapp-business-api', {
      body: { action: 'list-available-numbers' }
    });

    if (error) throw error;
    return data.numbers || [];
  }

  async connectNumber(connectionId: string, phoneNumber: string): Promise<void> {
    const { error } = await supabase.functions.invoke('whatsapp-business-api', {
      body: { 
        action: 'connect-number',
        connectionId,
        phoneNumber
      }
    });

    if (error) throw error;
  }
}

export const whatsappService = new WhatsAppService();