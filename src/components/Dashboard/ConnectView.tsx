import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { whatsappService, type WhatsAppConnection } from "@/services/whatsappService";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ConnectionCard } from "./Connect/ConnectionCard";

interface ConnectViewProps {
  botId: string;
}

export function ConnectView({ botId }: ConnectViewProps) {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [botId]);

  const loadConnections = async () => {
    try {
      const data = await whatsappService.getConnections(botId);
      setConnections(data);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    try {
      const newConnection = await whatsappService.createConnection(botId);
      setConnections([...connections, newConnection]);
      toast({
        title: "Success",
        description: "New WhatsApp connection created",
      });
    } catch (error) {
      console.error("Failed to add connection:", error);
      toast({
        title: "Error",
        description: "Failed to create WhatsApp connection",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      await whatsappService.deleteConnection(connectionId);
      setConnections(connections.filter((conn) => conn.id !== connectionId));
      toast({
        title: "Success",
        description: "WhatsApp connection deleted",
      });
    } catch (error) {
      console.error("Failed to delete connection:", error);
      toast({
        title: "Error",
        description: "Failed to delete WhatsApp connection",
        variant: "destructive",
      });
    }
  };

  const handleInitializeWhatsApp = async (connectionId: string) => {
    try {
      setIsInitializing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      const { error } = await supabase.functions.invoke('whatsapp-init', {
        body: { connectionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }

      await loadConnections();
      toast({
        title: "Success",
        description: "WhatsApp QR code generated successfully",
      });
    } catch (error) {
      console.error("Failed to initialize WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
        <Button onClick={handleAddConnection}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onDelete={handleDeleteConnection}
            onInitialize={handleInitializeWhatsApp}
            isInitializing={isInitializing}
          />
        ))}
      </div>
    </div>
  );
}