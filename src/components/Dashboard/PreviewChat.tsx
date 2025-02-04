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

interface CalendarConfig {
  selected_calendar: string;
  calendar_name?: string;
}

interface CalendarIntegration {
  id: string;
  bot_id: string;
  service_name: string;
  status: string;
  config: CalendarConfig | null;
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
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null);
  const [isCalendarConfigured, setIsCalendarConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCalendarIntegration();
    }
  }, [open, botId]);

  const fetchCalendarIntegration = async () => {
    try {
      const { data: integration, error } = await supabase
        .from('bot_integrations')
        .select('*')
        .eq('bot_id', botId)
        .eq('service_name', 'cal')
        .maybeSingle();

      if (error) throw error;

      // Verificar si la integración está completamente configurada
      const isConfigured = integration && 
                          integration.status === 'connected' && 
                          integration.config?.selected_calendar;

      setIsCalendarConfigured(!!isConfigured);
      setCalendarIntegration(integration);

    } catch (error) {
      console.error('Error fetching calendar integration:', error);
      setIsCalendarConfigured(false);
    }
  };

  const handleCalendarAction = async (action: string, params: string) => {
    if (!isCalendarConfigured) {
      const errorMessage = "Lo siento, la integración con el calendario no está configurada correctamente. Por favor, configura la integración con Cal.com primero.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage
      }]);
      return;
    }

    try {
      if (action === 'check_availability') {
        const { data, error } = await supabase.functions.invoke('cal-api', {
          body: { 
            action: 'check_availability', 
            date: params,
            botId 
          }
        });

        if (error) throw error;

        if (data.availableSlots && data.availableSlots.length > 0) {
          const slotsMessage = `Los horarios disponibles para ${params} son:\n` +
            data.availableSlots.map((slot: string) => `- ${slot}`).join('\n');
          
          setMessages(prev => [...prev, {
            role: "assistant",
            content: slotsMessage
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `Lo siento, no hay horarios disponibles para ${params}. ¿Te gustaría revisar otro día?`
          }]);
        }
      } else if (action === 'schedule') {
        const [date, time] = params.split(',');
        const { data, error } = await supabase.functions.invoke('cal-api', {
          body: { 
            action: 'schedule', 
            date,
            time,
            botId 
          }
        });

        if (error) throw error;

        setMessages(prev => [...prev, {
          role: "assistant",
          content: `¡Perfecto! Tu reunión ha sido agendada para el ${date} a las ${time}. Recibirás un correo de confirmación con los detalles.`
        }]);
      }
    } catch (error) {
      console.error('Error handling calendar action:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud de calendario",
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
      
      if (processedReply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: processedReply },
        ]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del bot",
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
          <SheetTitle>Chat con {botName}</SheetTitle>
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
                  Pensando...
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
              placeholder="Escribe tu mensaje..."
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