import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, QrCode } from "lucide-react";
import { WhatsAppConnection } from "@/services/whatsappService";

interface QRCodeDialogProps {
  connection: WhatsAppConnection;
  onInitialize: (connectionId: string) => Promise<void>;
  isInitializing: boolean;
}

export function QRCodeDialog({ 
  connection,
  onInitialize,
  isInitializing 
}: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: qrData, isLoading } = useQuery({
    queryKey: ["whatsapp-qr", connection.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("qr_code, status")
        .eq("id", connection.id)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: connection.status === "connecting" ? 3000 : false,
    enabled: isOpen,
  });

  useEffect(() => {
    if (qrData?.status === "connected") {
      setIsOpen(false);
    }
  }, [qrData?.status]);

  const handleInitialize = async () => {
    await onInitialize(connection.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleInitialize}
          disabled={isInitializing}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6">
          {isLoading || isInitializing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : qrData?.qr_code ? (
            <>
              <img
                src={qrData.qr_code}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Escanea este código QR con WhatsApp en tu teléfono para conectar el bot
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generando código QR...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}