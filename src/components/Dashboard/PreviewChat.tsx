import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PreviewChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId: string;
  botName: string;
}

export const PreviewChat = ({
  open,
  onOpenChange,
  botId,
  botName,
}: PreviewChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [calendarIntegration, setCalendarIntegration] = useState<any>(null);

  useEffect(() => {
    // Fetch Cal.com integration status when chat opens
    if (open) {
      fetchCalendarIntegration();
    }
  }, [open, botId]);

  const fetchCalendarIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_integrations')
        .select('*')
        .eq('bot_id', botId)
        .eq('service_name', 'cal')
        .maybeSingle();

      if (error) throw error;
      setCalendarIntegration(data);
    } catch (error) {
      console.error('Error fetching calendar integration:', error);
    }
  };

  const handleCalendarAction = async (action: string, params: string) => {
    if (!calendarIntegration?.access_token) {
      toast({
        title: "Error",
        description: "Calendar integration not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === 'check_availability') {
        // Aquí implementaremos la lógica para verificar disponibilidad
        const date = params;
        // TODO: Implementar llamada a Cal.com API para verificar disponibilidad
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `I'll check the availability for ${date}. (This is a placeholder - Cal.com API integration pending)`
        }]);
      } else if (action === 'schedule') {
        // Aquí implementaremos la lógica para agendar
        const [date, time] = params.split(',');
        // TODO: Implementar llamada a Cal.com API para agendar
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `I'll schedule the appointment for ${date} at ${time}. (This is a placeholder - Cal.com API integration pending)`
        }]);
      }
    } catch (error) {
      console.error('Error handling calendar action:', error);
      toast({
        title: "Error",
        description: "Failed to process calendar action",
        variant: "destructive",
      });
    }
  };

  const processCalendarActions = (content: string) => {
    const regex = /\[CALENDAR_ACTION\](.*?)\{(.*?)\}\[\/CALENDAR_ACTION\]/g;
    let match;
    let processedContent = content;

    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, action, params] = match;
      handleCalendarAction(action, params);
      processedContent = processedContent.replace(fullMatch, '');
    }

    return processedContent.trim();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: userMessage, botId },
      });

      if (error) throw error;

      const processedReply = processCalendarActions(data.reply);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: processedReply },
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from the bot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Chat with {botName}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-6 border-t mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};