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
        className="glass-card p-6 flex items-center justify-center gap-3 cursor-pointer hover:bg-secondary/70 transition-all duration-300 border-2 border-dashed border-primary/20 min-h-[180px] group hover-scale"
        onClick={onClick}
      >
        <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-base text-primary/80 font-medium">Create New Bot</span>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={cn(
          "glass-card p-6 flex flex-col gap-3 hover:bg-secondary/70 transition-all duration-300 cursor-pointer relative overflow-hidden group hover-scale",
          isSelected && "ring-2 ring-primary border-transparent"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-base text-white/90 group-hover:text-primary transition-colors">{name}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewChatOpen(true);
            }}
          >
            <Eye className="w-4 h-4 text-white/80" />
          </Button>
        </div>

        <div className="flex gap-2 mt-2">
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
                whatsappStatus === "connected" && "text-green-400 border-green-400/30",
                whatsappStatus === "connecting" && "text-yellow-400 border-yellow-400/30",
                whatsappStatus === "disconnected" && "text-gray-400 border-gray-400/30"
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