import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConnection {
  id: string;
  bot_id: string;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  session_data: any;
  created_at: string;
  updated_at: string;
  twilio_phone_sid: string | null;
  twilio_status: string;
  monthly_cost: number;
}

class WhatsAppService {
  async getConnections(botId: string): Promise<WhatsAppConnection[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('bot_id', botId);

      if (error) throw error;
      
      return (data || []).map(conn => ({
        ...conn,
        status: (conn.status as WhatsAppConnection['status']) || 'disconnected'
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
        status: (data.status as WhatsAppConnection['status']) || 'disconnected'
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

  async listAvailableNumbers(countryCode: string = 'US'): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('twilio-api', {
      body: { action: 'list-available-numbers', countryCode }
    });

    if (error) throw error;
    return data.numbers;
  }

  async purchaseNumber(connectionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('twilio-api', {
      body: { action: 'purchase-number', connectionId }
    });

    if (error) throw error;
  }
}

export const whatsappService = new WhatsAppService();