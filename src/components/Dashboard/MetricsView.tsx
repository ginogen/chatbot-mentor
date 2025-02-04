import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsViewProps {
  botId: string;
}

export function MetricsView({ botId }: MetricsViewProps) {
  const { data: metrics } = useQuery({
    queryKey: ["botMetrics", botId],
    queryFn: async () => {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("bot_id", botId);

      if (error) throw error;
      return {
        totalConversations: conversations?.length || 0,
      };
    },
  });

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics?.totalConversations}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}