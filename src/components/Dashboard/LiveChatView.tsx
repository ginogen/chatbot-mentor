import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface LiveChatViewProps {
  botId: string;
}

export function LiveChatView({ botId }: LiveChatViewProps) {
  const { data: conversations } = useQuery({
    queryKey: ["conversations", botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_identifier,
          created_at,
          messages (
            id,
            content,
            role,
            rating,
            created_at
          )
        `)
        .eq("bot_id", botId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleRating = async (messageId: string, rating: "positive" | "negative") => {
    const { error } = await supabase
      .from("messages")
      .update({ rating })
      .eq("id", messageId);

    if (error) throw error;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Live Chat</h1>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-6">
          {conversations?.map((conversation) => (
            <div key={conversation.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">User: {conversation.user_identifier}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(conversation.created_at).toLocaleString()}
                </span>
              </div>
              <div className="space-y-4">
                {conversation.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "assistant" ? "justify-between" : "justify-end"
                    } items-start gap-2`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "assistant"
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRating(message.id, "positive")}
                          className={message.rating === "positive" ? "text-green-500" : ""}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRating(message.id, "negative")}
                          className={message.rating === "negative" ? "text-red-500" : ""}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}