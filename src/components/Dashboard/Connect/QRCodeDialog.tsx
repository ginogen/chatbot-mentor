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
              onClick={() => onInitialize(connection.id)}
              disabled={isInitializing}
            >
              {isInitializing ? "Initializing..." : "Generate QR Code"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}