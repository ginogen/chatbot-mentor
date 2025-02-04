import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  integrationService,
  type Integration,
  type IntegrationService,
} from "@/services/integrationService";
import { Skeleton } from "@/components/ui/skeleton";

interface IntegrationsViewProps {
  botId: string;
}

export function IntegrationsView({ botId }: IntegrationsViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const integrationConfigs = [
    {
      name: "Cal.com",
      description: "Schedule meetings directly through your bot",
      icon: Calendar,
      service: "cal" as IntegrationService,
      authUrl: "https://cal.com/oauth",
    },
    {
      name: "Calendly",
      description: "Automate meeting scheduling with Calendly",
      icon: Calendar,
      service: "calendly" as IntegrationService,
      authUrl: "https://auth.calendly.com/oauth/authorize",
    },
    {
      name: "MercadoPago",
      description: "Accept payments through MercadoPago",
      icon: CreditCard,
      service: "mercadopago" as IntegrationService,
      authUrl: "https://auth.mercadopago.com/authorization",
    },
    {
      name: "PayPal",
      description: "Process payments with PayPal",
      icon: CreditCard,
      service: "paypal" as IntegrationService,
      authUrl: "https://www.paypal.com/connect",
    },
  ];

  useEffect(() => {
    loadIntegrations();
  }, [botId]);

  const loadIntegrations = async () => {
    try {
      const data = await integrationService.getIntegrations(botId);
      setIntegrations(data);
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast({
        title: "Error",
        description: "Failed to load integrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service: IntegrationService) => {
    setConnecting(true);
    try {
      const config = integrationConfigs.find((c) => c.service === service);
      if (!config) throw new Error("Invalid service");

      // Open OAuth window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const authWindow = window.open(
        config.authUrl,
        "Connect " + config.name,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        throw new Error("Failed to open authentication window");
      }

      // For demo purposes, we'll simulate a successful connection
      // In a real implementation, you would handle the OAuth callback
      const credentials = { token: "demo_token" };
      await integrationService.connectIntegration(botId, service, credentials);
      await loadIntegrations();

      toast({
        title: "Success",
        description: `Connected to ${config.name} successfully.`,
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      toast({
        title: "Error",
        description: "Failed to connect to the service.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (service: IntegrationService) => {
    try {
      await integrationService.disconnectIntegration(botId, service);
      await loadIntegrations();
      
      const config = integrationConfigs.find((c) => c.service === service);
      toast({
        title: "Success",
        description: `Disconnected from ${config?.name} successfully.`,
      });
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from the service.",
        variant: "destructive",
      });
    }
  };

  const getIntegrationStatus = (service: IntegrationService) => {
    return integrations.find((i) => i.service_name === service)?.status || "disconnected";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrationConfigs.map((integration) => {
          const status = getIntegrationStatus(integration.service);
          const isConnected = status === "connected";

          return (
            <Card key={integration.service} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <integration.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: {status}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isConnected ? "destructive" : "outline"}
                  size="sm"
                  onClick={() =>
                    isConnected
                      ? handleDisconnect(integration.service)
                      : handleConnect(integration.service)
                  }
                  disabled={connecting}
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}