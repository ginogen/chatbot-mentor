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
    <Sidebar className="w-full bg-secondary">
      <SidebarHeader className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white">
          WhatsApp Bot Creator
        </h2>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onTrainMenuToggle}
              className="flex items-center w-full px-3 py-2 text-white hover:bg-primary/10 rounded-lg"
            >
              <Bot className="w-5 h-5 mr-2" />
              <span>Train Bot</span>
            </SidebarMenuButton>
            {isTrainMenuOpen && (
              <SidebarMenuSub>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCreateBot}
                  className="w-full justify-start text-sm mb-2 text-white hover:bg-primary/10"
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
                      className={`flex items-center w-full px-3 py-2 text-white hover:bg-primary/10 rounded-lg ${
                        selectedBot === bot.id && selectedView === "train"
                          ? "bg-primary/20"
                          : ""
                      }`}
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
                className={`flex items-center w-full px-3 py-2 text-white hover:bg-primary/10 rounded-lg ${
                  selectedView === item.id ? "bg-primary/20" : ""
                }`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};