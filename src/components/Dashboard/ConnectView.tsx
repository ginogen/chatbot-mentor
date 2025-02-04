import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { whatsappService, type WhatsAppConnection } from "@/services/whatsappService";
import { Plus, Trash2, RefreshCw, QrCode, Maximize2 } from "lucide-react";
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
} from "@/components/ui/dialog";

interface ConnectViewProps {
  botId: string;
}

export function ConnectView({ botId }: ConnectViewProps) {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [botId]);

  const loadConnections = async () => {
    try {
      const data = await whatsappService.getConnections(botId);
      setConnections(data);
      // Intentar inicializar las conexiones existentes
      data.forEach(connection => {
        if (connection.status === 'disconnected') {
          initializeConnection(connection.id);
        }
      });
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
      await initializeConnection(newConnection.id);
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

  const initializeConnection = async (connectionId: string) => {
    try {
      await whatsappService.initialize(botId);
      const qrCode = await whatsappService.getQRCode(connectionId);
      console.log("QR Code received for connection", connectionId, ":", qrCode);
      setQrCodes((prev) => ({ ...prev, [connectionId]: qrCode }));
    } catch (error) {
      console.error("Failed to initialize WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to initialize WhatsApp connection",
        variant: "destructive",
      });
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => initializeConnection(connection.id)}
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => initializeConnection(connection.id)}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
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

            {qrCodes[connection.id] && (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with WhatsApp on your phone to connect
                </p>
                <div className="relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      qrCodes[connection.id]
                    )}`}
                    alt="WhatsApp QR Code"
                    className="mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-0 right-0 bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedQR(qrCodes[connection.id])}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code with WhatsApp on your phone to connect
            </DialogDescription>
          </DialogHeader>
          {selectedQR && (
            <div className="flex justify-center p-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  selectedQR
                )}`}
                alt="WhatsApp QR Code"
                className="mx-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}