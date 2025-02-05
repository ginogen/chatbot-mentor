import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { WhatsAppConnection } from "@/services/whatsappService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    try {
      await onInitialize(connection.id);
      setError(null);
    } catch (err) {
      setError('Error al generar el código QR. Por favor intente nuevamente.');
      console.error('QR generation error:', err);
    }
  };

  return (
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
          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}
          
          {connection.qr_code ? (
            <div className="flex justify-center">
              <img
                src={connection.qr_code}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
                onError={(e) => {
                  console.error('Error loading QR code image');
                  setError('Error al cargar el código QR');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleInitialize}
              disabled={isInitializing}
            >
              {isInitializing ? "Generando código QR..." : "Generar código QR"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}