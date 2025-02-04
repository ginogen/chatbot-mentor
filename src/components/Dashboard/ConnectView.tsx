import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { whatsappService } from "@/services/whatsappService";

interface ConnectViewProps {
  botId: string;
}

export function ConnectView({ botId }: ConnectViewProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const initializeWhatsApp = async () => {
      try {
        await whatsappService.initialize();
        const qrCode = await whatsappService.getQRCode();
        setQrCode(qrCode);
      } catch (error) {
        console.error("Failed to initialize WhatsApp:", error);
      }
    };

    initializeWhatsApp();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
      {qrCode && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
          <p className="mb-4">
            Scan this QR code with WhatsApp on your phone to connect:
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              qrCode
            )}`}
            alt="WhatsApp QR Code"
            className="mx-auto"
          />
        </Card>
      )}
    </div>
  );
}