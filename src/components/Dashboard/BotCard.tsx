import { Bot, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BotCardProps {
  isNew?: boolean;
  name?: string;
  status?: "active" | "inactive";
  whatsappStatus?: "disconnected" | "connecting" | "connected";
  onClick: () => void;
}

export const BotCard = ({ isNew, name, status, whatsappStatus, onClick }: BotCardProps) => {
  if (isNew) {
    return (
      <Card
        className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-2 border-dashed min-h-[200px]"
        onClick={onClick}
      >
        <Plus className="w-8 h-8 text-gray-400" />
        <p className="text-gray-600 font-medium">Create New Bot</p>
      </Card>
    );
  }

  return (
    <Card
      className="p-6 flex flex-col gap-4 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <Bot className="w-8 h-8 text-primary" />
        <div className="flex gap-2">
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className={status === "active" ? "bg-green-500" : ""}
          >
            {status}
          </Badge>
          {whatsappStatus && (
            <Badge
              variant="outline"
              className={`${
                whatsappStatus === "connected"
                  ? "border-green-500 text-green-700"
                  : whatsappStatus === "connecting"
                  ? "border-yellow-500 text-yellow-700"
                  : "border-gray-500 text-gray-700"
              }`}
            >
              WhatsApp: {whatsappStatus}
            </Badge>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">Click to manage this bot</p>
      </div>
    </Card>
  );
};