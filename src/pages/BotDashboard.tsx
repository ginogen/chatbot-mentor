import { useState } from "react";
import { useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BotSidebar } from "@/components/Dashboard/BotSidebar";
import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { ConnectView } from "@/components/Dashboard/ConnectView";
import { MetricsView } from "@/components/Dashboard/MetricsView";

type ViewType = "metrics" | "train" | "chat" | "connect";

export default function BotDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("metrics");
  const { botId } = useParams();

  if (!botId) return <div>Bot not found</div>;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BotSidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-8">
          {currentView === "metrics" && <MetricsView botId={botId} />}
          {currentView === "train" && <TrainBotView botId={botId} />}
          {currentView === "chat" && <LiveChatView botId={botId} />}
          {currentView === "connect" && <ConnectView botId={botId} />}
        </main>
      </div>
    </SidebarProvider>
  );
}