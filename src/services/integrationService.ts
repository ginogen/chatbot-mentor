import { supabase } from "@/integrations/supabase/client";

export type IntegrationStatus = "connected" | "disconnected" | "pending";
export type IntegrationService = "cal" | "calendly" | "mercadopago" | "paypal";

export interface Integration {
  id: string;
  bot_id: string;
  service_name: IntegrationService;
  credentials: Record<string, any>;
  status: IntegrationStatus;
  created_at: string;
  updated_at: string;
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
    credentials: Record<string, any>
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from("bot_integrations")
      .upsert(
        {
          bot_id: botId,
          service_name: service,
          credentials,
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
      .update({ status: "disconnected", credentials: {} })
      .eq("bot_id", botId)
      .eq("service_name", service);

    if (error) throw error;
  },
};