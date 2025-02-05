import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { whatsappService, type WhatsAppConnection } from "@/services/whatsappService";
import { Plus, Trash2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
      
      // Get the current session
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

      if (error) throw error;

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
          <Card key={connection.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {connection.phone_number || "New Connection"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Status: {connection.status}
                </p>
              </div>
              <div className="flex space-x-2">
                {!connection.phone_number && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect WhatsApp</DialogTitle>
                        <DialogDescription>
                          Scan this QR code with WhatsApp on your phone to connect.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {connection.qr_code ? (
                          <div className="flex justify-center">
                            <img
                              src={`data:image/png;base64,${connection.qr_code}`}
                              alt="WhatsApp QR Code"
                              className="w-64 h-64"
                            />
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleInitializeWhatsApp(connection.id)}
                            disabled={isInitializing}
                          >
                            {isInitializing ? "Initializing..." : "Generate QR Code"}
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this WhatsApp connection?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteConnection(connection.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
