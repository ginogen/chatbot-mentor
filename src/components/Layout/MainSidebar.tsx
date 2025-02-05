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

  const baseMenuItemClasses = "flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200";
  const menuItemStateClasses = (isActive: boolean) => 
    isActive 
      ? "bg-primary/10 text-primary font-medium" 
      : "text-white/80 hover:bg-white/10 hover:text-white active:bg-white/5";

  return (
    <Sidebar className="bg-secondary/95 backdrop-blur-sm border-r border-white/5">
      <SidebarHeader className="border-b border-white/5 p-4">
        <h2 className="text-lg font-semibold text-white">WhatsApp Bot Creator</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onTrainMenuToggle}
              className={`${baseMenuItemClasses} ${menuItemStateClasses(selectedView === "train")}`}
            >
              <div className="flex items-center">
                <Bot className="w-5 h-5 mr-2.5" />
                <span>Train Bot</span>
              </div>
            </SidebarMenuButton>
            {isTrainMenuOpen && (
              <SidebarMenuSub>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCreateBot}
                  className="w-full justify-start text-sm mb-2 px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white transition-colors"
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
                      className={`${baseMenuItemClasses} ${menuItemStateClasses(selectedBot === bot.id && selectedView === "train")}`}
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
                className={`${baseMenuItemClasses} ${menuItemStateClasses(selectedView === item.id)}`}
              >
                <item.icon className="w-5 h-5 mr-2.5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};