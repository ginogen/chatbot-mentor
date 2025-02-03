import { Bot, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BotCardProps {
  isNew?: boolean;
  name?: string;
  status?: "active" | "inactive";
  onClick: () => void;
}

export const BotCard = ({ isNew, name, status, onClick }: BotCardProps) => {
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
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">Click to manage this bot</p>
      </div>
    </Card>
  );
};