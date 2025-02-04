import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { IntegrationsView } from "@/components/Dashboard/IntegrationsView";
import { ConnectView } from "@/components/Dashboard/ConnectView";
import { SettingsView } from "@/components/Dashboard/SettingsView";

interface MainContentProps {
  selectedBot: string | null;
  selectedView: string;
}

export const MainContent = ({ selectedBot, selectedView }: MainContentProps) => {
  if (!selectedBot && selectedView !== "settings") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a bot to get started</p>
      </div>
    );
  }

  switch (selectedView) {
    case "train":
      return <TrainBotView botId={selectedBot!} />;
    case "chat":
      return <LiveChatView botId={selectedBot!} />;
    case "integrations":
      return <IntegrationsView botId={selectedBot!} />;
    case "connect":
      return <ConnectView botId={selectedBot!} />;
    case "settings":
      return <SettingsView />;
    default:
      return null;
  }
};