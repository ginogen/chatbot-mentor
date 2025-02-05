import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Trash2 } from "lucide-react";
import { WhatsAppConnection } from "@/services/whatsappService";
import { QRCodeDialog } from "./QRCodeDialog";
import { DeleteConnectionDialog } from "./DeleteConnectionDialog";

interface ConnectionCardProps {
  connection: WhatsAppConnection;
  onDelete: (connectionId: string) => Promise<void>;
  onInitialize: (connectionId: string) => Promise<void>;
  isInitializing: boolean;
}

export function ConnectionCard({ 
  connection, 
  onDelete, 
  onInitialize,
  isInitializing 
}: ConnectionCardProps) {
  return (
    <Card className="p-6 space-y-4">
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
            <QRCodeDialog
              connection={connection}
              onInitialize={onInitialize}
              isInitializing={isInitializing}
            />
          )}
          <DeleteConnectionDialog
            onConfirmDelete={() => onDelete(connection.id)}
          />
        </div>
      </div>
    </Card>
  );
}