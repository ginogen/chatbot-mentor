import { Bot, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TrainBotSheet } from "./TrainBotSheet";
import { PreviewChat } from "./PreviewChat";

interface BotCardProps {
  isNew?: boolean;
  name?: string;
  id?: string;
  status?: "active" | "inactive";
  whatsappStatus?: "disconnected" | "connecting" | "connected";
  onClick: () => void;
}

export const BotCard = ({ isNew, name, id, status, whatsappStatus, onClick }: BotCardProps) => {
  const [isTrainSheetOpen, setIsTrainSheetOpen] = useState(false);
  const [isPreviewChatOpen, setIsPreviewChatOpen] = useState(false);

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
    <>
      <Card className="p-6 flex flex-col gap-4 hover:bg-gray-50 transition-colors min-h-[200px]">
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
        <div className="mt-auto pt-4 flex gap-2">
          <Button variant="outline" className="w-full" onClick={onClick}>
            Manage
          </Button>
          <Button 
            variant="default" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsTrainSheetOpen(true);
            }}
          >
            Train Bot
          </Button>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewChatOpen(true);
            }}
          >
            Preview
          </Button>
        </div>
      </Card>
      {id && name && (
        <>
          <TrainBotSheet
            open={isTrainSheetOpen}
            onOpenChange={setIsTrainSheetOpen}
            botId={id}
          />
          <PreviewChat
            open={isPreviewChatOpen}
            onOpenChange={setIsPreviewChatOpen}
            botId={id}
            botName={name}
          />
        </>
      )}
    </>
  );
};