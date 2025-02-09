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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarSelector } from "./Integrations/CalendarSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IntegrationsViewProps {
  botId: string;
}

export function IntegrationsView({ botId }: IntegrationsViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
  const [apiKey, setApiKey] = useState("");

  const integrationConfigs = [
    {
      name: "Cal.com",
      description: "Schedule meetings directly through your bot",
      icon: Calendar,
      service: "cal" as IntegrationService,
      fields: {
        api_key: "API Key",
      },
      helpText: "You can find your API key in your Cal.com account settings under Developer Settings -> API Keys.",
    },
    {
      name: "MercadoPago",
      description: "Accept payments through MercadoPago",
      icon: CreditCard,
      service: "mercadopago" as IntegrationService,
      fields: {
        client_id: "Client ID",
        client_secret: "Client Secret",
      },
      helpText: "You can find your credentials in your MercadoPago developer dashboard.",
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

      if (service === "cal") {
        await integrationService.connectIntegration(botId, service, {
          api_key: apiKey,
        });
      } else {
        // Handle other services with client_id/client_secret
        await integrationService.connectIntegration(botId, service, {
          client_id: "",
          client_secret: "",
        });
      }
      
      await loadIntegrations();
      toast({
        title: "Success",
        description: `Connected to ${config.name} successfully.`,
      });
      setSelectedService(null);
      setApiKey("");
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
          {[1, 2].map((i) => (
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
          const currentIntegration = integrations.find(
            (i) => i.service_name === integration.service
          );

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
                {isConnected ? (
                  <div className="space-y-4">
                    {integration.service === "cal" && currentIntegration && (
                      <CalendarSelector
                        botId={botId}
                        integration={currentIntegration}
                        onUpdate={loadIntegrations}
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(integration.service)}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Dialog open={selectedService === integration.service} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedService(null);
                      setApiKey("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedService(integration.service)}
                      >
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect to {integration.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          {integration.helpText}
                        </p>
                        <div className="space-y-4">
                          {integration.service === "cal" ? (
                            <div className="space-y-2">
                              <Label htmlFor="api_key">API Key</Label>
                              <Input
                                id="api_key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                              />
                            </div>
                          ) : (
                            // Keep existing client_id/client_secret fields for other services
                            Object.entries(integration.fields).map(([key, label]) => (
                              <div key={key} className="space-y-2">
                                <Label htmlFor={key}>{label}</Label>
                                <Input
                                  id={key}
                                  type={key.includes("secret") ? "password" : "text"}
                                />
                              </div>
                            ))
                          )}
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleConnect(integration.service)}
                          disabled={connecting || (integration.service === "cal" ? !apiKey : false)}
                        >
                          {connecting ? "Connecting..." : "Connect"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
