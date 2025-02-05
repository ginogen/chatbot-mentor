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
      
      return (data || []).map(connection => ({
        ...connection,
        status: (connection.status || 'disconnected') as WhatsAppStatus
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
        status: (data.status || 'disconnected') as WhatsAppStatus
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
      // Primero verificamos si hay una sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error de sesión:', sessionError);
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      if (!session) {
        console.error('No hay sesión activa');
        // Intentamos refrescar la sesión
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('No hay sesión activa y no se pudo refrescar');
        }
      }

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession) {
        throw new Error('No se pudo establecer una sesión válida');
      }

      console.log('Sesión encontrada, inicializando WhatsApp...');
      
      const { error: functionError } = await supabase.functions.invoke('whatsapp-init', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        }
      });

      if (functionError) {
        console.error('Error al inicializar WhatsApp:', functionError);
        throw functionError;
      }
    } catch (error) {
      console.error('Error al inicializar WhatsApp:', error);
      throw error;
    }
  }

  async getQRCode(connectionId: string): Promise<string | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error de sesión:', sessionError);
        throw sessionError;
      }

      if (!session) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('No hay sesión activa y no se pudo refrescar');
        }
      }

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession) {
        throw new Error('No se pudo establecer una sesión válida');
      }

      const { data, error } = await supabase.functions.invoke('whatsapp-qr', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        }
      });

      if (error) throw error;
      return data?.qrCode || null;
    } catch (error) {
      console.error('Error al obtener el código QR:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
