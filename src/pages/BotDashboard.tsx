import { useParams } from "react-router-dom";
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BotSidebar } from "@/components/Dashboard/BotSidebar";
import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { ConnectView } from "@/components/Dashboard/ConnectView";
import { PreviewChat } from "@/components/Dashboard/PreviewChat";
import { Eye } from "lucide-react";

const BotDashboard = () => {
  const { botId } = useParams();
  const [activeTab, setActiveTab] = useState<"metrics" | "train" | "chat" | "connect">("train");
  const [isPreviewChatOpen, setIsPreviewChatOpen] = useState(false);

  if (!botId) return null;

  return (
    <div className="flex h-screen">
      <BotSidebar currentView={activeTab} onViewChange={setActiveTab} />
      <div className="flex-1 relative">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="train" className="h-full m-0">
            <TrainBotView botId={botId} />
          </TabsContent>
          <TabsContent value="connect" className="h-full m-0">
            <ConnectView botId={botId} />
          </TabsContent>
          <TabsContent value="chat" className="h-full m-0">
            <LiveChatView botId={botId} />
          </TabsContent>
        </Tabs>

        {/* Floating Preview Button */}
        <button
          onClick={() => setIsPreviewChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
          title="Preview Chat"
        >
          <Eye className="w-6 h-6 text-primary-foreground" />
        </button>

        <PreviewChat
          open={isPreviewChatOpen}
          onOpenChange={setIsPreviewChatOpen}
          botId={botId}
          botName="Bot Preview"
        />
      </div>
    </div>
  );
};

export default BotDashboard;