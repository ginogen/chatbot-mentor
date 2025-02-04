import { supabase } from "@/integrations/supabase/client";

export type IntegrationStatus = "connected" | "disconnected" | "pending";
export type IntegrationService = "cal" | "mercadopago";

export interface Integration {
  id: string;
  bot_id: string;
  service_name: IntegrationService;
  status: IntegrationStatus;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  config: Record<string, any> | null;
}

export interface IntegrationCredentials {
  client_id: string;
  client_secret: string;
}

export const integrationService = {
  async getIntegrations(botId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from("bot_integrations")
      .select("*")
      .eq("bot_id", botId);

    if (error) throw error;
    return data as Integration[];
  },

  async connectIntegration(
    botId: string,
    service: IntegrationService,
    credentials: IntegrationCredentials
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from("bot_integrations")
      .upsert(
        {
          bot_id: botId,
          service_name: service,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          status: "connected",
        },
        { onConflict: "bot_id,service_name" }
      )
      .select()
      .single();

    if (error) throw error;
    return data as Integration;
  },

  async disconnectIntegration(botId: string, service: IntegrationService): Promise<void> {
    const { error } = await supabase
      .from("bot_integrations")
      .update({ 
        status: "disconnected", 
        client_id: null,
        client_secret: null,
        access_token: null,
        refresh_token: null,
        token_expires_at: null
      })
      .eq("bot_id", botId)
      .eq("service_name", service);

    if (error) throw error;
  },

  async updateIntegrationConfig(
    botId: string,
    service: IntegrationService,
    config: Record<string, any>
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from("bot_integrations")
      .update({ config })
      .eq("bot_id", botId)
      .eq("service_name", service)
      .select()
      .single();

    if (error) throw error;
    return data as Integration;
  },
};
