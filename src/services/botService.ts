import { supabase } from "@/integrations/supabase/client";

export interface Bot {
  id: string;
  name: string;
  status: "active" | "inactive";
  whatsapp_status: "disconnected" | "connecting" | "connected";
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export const botService = {
  async createBot(name: string): Promise<Bot> {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('bots')
      .insert([
        { 
          name,
          user_id: user?.id,
          status: 'inactive' as const,
          whatsapp_status: 'disconnected' as const
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Bot;
  },

  async getBots(): Promise<Bot[]> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Bot[];
  },

  async updateBotStatus(
    id: string,
    status: "active" | "inactive",
    whatsapp_status: "disconnected" | "connecting" | "connected"
  ): Promise<void> {
    const { error } = await supabase
      .from('bots')
      .update({ status, whatsapp_status })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteBot(id: string): Promise<void> {
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async sendMessage(botId: string, message: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { botId, message }
    });

    if (error) throw error;
    return data.reply;
  }
};