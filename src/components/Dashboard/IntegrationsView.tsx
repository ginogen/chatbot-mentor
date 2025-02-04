import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface IntegrationsViewProps {
  botId: string;
}

export function IntegrationsView({ botId }: IntegrationsViewProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  const integrations = [
    {
      name: "Cal.com",
      description: "Schedule meetings directly through your bot",
      icon: Calendar,
      service: "cal",
    },
    {
      name: "Calendly",
      description: "Automate meeting scheduling with Calendly",
      icon: Calendar,
      service: "calendly",
    },
    {
      name: "MercadoPago",
      description: "Accept payments through MercadoPago",
      icon: CreditCard,
      service: "mercadopago",
    },
    {
      name: "PayPal",
      description: "Process payments with PayPal",
      icon: CreditCard,
      service: "paypal",
    },
  ];

  const handleConnect = async (service: string) => {
    setConnecting(true);
    try {
      // We'll implement the actual connection logic later
      console.log(`Connecting to ${service} for bot ${botId}`);
      toast({
        title: "Coming Soon",
        description: `Integration with ${service} will be available soon.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the service.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
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
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect(integration.service)}
                disabled={connecting}
              >
                Connect
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}