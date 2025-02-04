import { Bot, MessageSquare, Plug, Settings, Plug2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Bot as BotType } from "@/services/botService";

interface MainSidebarProps {
  bots: BotType[];
  selectedBot: string | null;
  selectedView: string;
  isTrainMenuOpen: boolean;
  onCreateBot: () => void;
  onBotSelect: (botId: string) => void;
  onViewSelect: (view: string) => void;
  onTrainMenuToggle: () => void;
}

export const MainSidebar = ({
  bots,
  selectedBot,
  selectedView,
  isTrainMenuOpen,
  onCreateBot,
  onBotSelect,
  onViewSelect,
  onTrainMenuToggle,
}: MainSidebarProps) => {
  const menuItems = [
    { id: "chat", label: "Live Chat", icon: MessageSquare },
    { id: "connect", label: "Connect", icon: Plug },
    { id: "integrations", label: "Integrations", icon: Plug2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Sidebar className="sidebar-gradient border-r border-white/5">
      <SidebarHeader className="border-b border-white/5 p-4">
        <h2 className="text-lg font-semibold text-gradient">WhatsApp Bot Creator</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onTrainMenuToggle}
              className="nav-item"
            >
              <div className="flex items-center">
                <Bot className="icon" />
                <span>Train Bot</span>
              </div>
            </SidebarMenuButton>
            {isTrainMenuOpen && (
              <SidebarMenuSub>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCreateBot}
                  className="w-full justify-start text-sm mb-2 hover:bg-white/5"
                >
                  + Add Bot
                </Button>
                {bots.map((bot) => (
                  <SidebarMenuSubItem key={bot.id}>
                    <SidebarMenuSubButton
                      onClick={() => {
                        onBotSelect(bot.id);
                        onViewSelect("train");
                      }}
                      className={`nav-item ${selectedBot === bot.id && selectedView === "train" ? "active" : ""}`}
                    >
                      {bot.name}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>

          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onViewSelect(item.id)}
                className={`nav-item ${selectedView === item.id ? "active" : ""}`}
              >
                <item.icon className="icon" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};