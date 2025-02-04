import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface CreateBotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBot: (name: string) => void;
}

export const CreateBotModal = ({
  open,
  onOpenChange,
  onCreateBot,
}: CreateBotModalProps) => {
  const [botName, setBotName] = useState("");
  const { toast } = useToast();

  const handleCreate = () => {
    if (!botName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your bot",
        variant: "destructive",
      });
      return;
    }
    onCreateBot(botName);
    setBotName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Bot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/90">Bot Name</Label>
            <Input
              id="name"
              placeholder="Enter bot name..."
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>
          <Button onClick={handleCreate} className="w-full">
            Create Bot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};