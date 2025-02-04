import { Bot, Plus, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PreviewChat } from "./PreviewChat";
import { cn } from "@/lib/utils";

interface BotCardProps {
  isNew?: boolean;
  name?: string;
  id?: string;
  status?: "active" | "inactive";
  whatsappStatus?: "disconnected" | "connecting" | "connected";
  onClick: () => void;
  isSelected?: boolean;
}

export const BotCard = ({ 
  isNew, 
  name, 
  id, 
  status, 
  whatsappStatus, 
  onClick,
  isSelected 
}: BotCardProps) => {
  const [isPreviewChatOpen, setIsPreviewChatOpen] = useState(false);

  if (isNew) {
    return (
      <Card
        className="p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 border-2 border-dashed min-h-[80px] group"
        onClick={onClick}
      >
        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">New Bot</span>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={cn(
          "p-4 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer relative overflow-hidden",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{name}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewChatOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-1">
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className="text-xs"
          >
            {status}
          </Badge>
          {whatsappStatus && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                whatsappStatus === "connected" && "text-green-600 border-green-600",
                whatsappStatus === "connecting" && "text-yellow-600 border-yellow-600",
                whatsappStatus === "disconnected" && "text-gray-600 border-gray-600"
              )}
            >
              {whatsappStatus}
            </Badge>
          )}
        </div>
      </Card>
      {id && name && (
        <PreviewChat
          open={isPreviewChatOpen}
          onOpenChange={setIsPreviewChatOpen}
          botId={id}
          botName={name}
        />
      )}
    </>
  );
};