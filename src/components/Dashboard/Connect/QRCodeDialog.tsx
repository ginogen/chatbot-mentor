import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
}

export const QRCodeDialog = ({ isOpen, onClose, botId }: QRCodeDialogProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { data: connection, isLoading } = useQuery({
    queryKey: ["whatsapp-connection", botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("qr_code, status")
        .eq("bot_id", botId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  useEffect(() => {
    if (connection?.status === "connected") {
      onClose();
    }
  }, [connection?.status, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : connection?.qr_code ? (
            <>
              <img
                src={connection.qr_code}
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
};