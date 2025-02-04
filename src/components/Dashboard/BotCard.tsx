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
        className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 border-2 border-dashed min-h-[200px] group"
        onClick={onClick}
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Create New Bot</p>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={cn(
          "p-6 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer relative overflow-hidden group",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPreviewChatOpen(true);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110 z-10"
          title="Preview Chat"
        >
          <Eye className="w-5 h-5 text-primary" />
        </button>

        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-primary/5 rounded-full" />
        <div className="flex items-center justify-between relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex gap-2">
            <Badge
              variant={status === "active" ? "default" : "secondary"}
              className={`${
                status === "active" 
                  ? "bg-green-500 hover:bg-green-600" 
                  : ""
              } transition-colors`}
            >
              {status}
            </Badge>
            {whatsappStatus && (
              <Badge
                variant="outline"
                className={`${
                  whatsappStatus === "connected"
                    ? "border-green-500 text-green-700 dark:text-green-400"
                    : whatsappStatus === "connecting"
                    ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                    : "border-gray-500 text-gray-700 dark:text-gray-400"
                } transition-colors`}
              >
                WhatsApp: {whatsappStatus}
              </Badge>
            )}
          </div>
        </div>
        <div className="relative">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click to select this bot</p>
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