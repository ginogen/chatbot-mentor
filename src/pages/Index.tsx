import React from "react";
import { Bot, MessageSquare, Plug, BarChart, Plug2, ChevronDown, ChevronUp } from "lucide-react";
import { BotCard } from "@/components/Dashboard/BotCard";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { botService, Bot as BotType } from "@/services/botService";
import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { IntegrationsView } from "@/components/Dashboard/IntegrationsView";
import { ConnectView } from "@/components/Dashboard/ConnectView";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const Index = () => {
  const [bots, setBots] = React.useState<BotType[]>([]);
  const [selectedBot, setSelectedBot] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<string>("train");
  const [isTrainMenuOpen, setIsTrainMenuOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    loadBots();
    initializeWhatsApp();
  }, []);

  const loadBots = async () => {
    try {
      const loadedBots = await botService.getBots();
      setBots(loadedBots);
      if (loadedBots.length > 0 && !selectedBot) {
        setSelectedBot(loadedBots[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bots. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeWhatsApp = async () => {
    try {
      await whatsappService.initialize();
      toast({
        title: "WhatsApp Connection",
        description: "WhatsApp service initialized successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to WhatsApp service. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleCreateBot = async (name: string) => {
    try {
      const newBot = await botService.createBot(name);
      setBots([newBot, ...bots]);
      setSelectedBot(newBot.id);
      toast({
        title: "Success",
        description: "Bot created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bot. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: "chat", label: "Live Chat", icon: MessageSquare },
    { id: "connect", label: "Connect", icon: Plug },
    { id: "integrations", label: "Integrations", icon: Plug2 },
  ];

  const renderMainContent = () => {
    if (!selectedBot) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a bot to get started</p>
        </div>
      );
    }

    switch (selectedView) {
      case "train":
        return <TrainBotView botId={selectedBot} />;
      case "chat":
        return <LiveChatView botId={selectedBot} />;
      case "integrations":
        return <IntegrationsView botId={selectedBot} />;
      case "connect":
        return <ConnectView botId={selectedBot} />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <Sidebar>
          <SidebarHeader className="border-b border-border p-4">
            <h2 className="text-lg font-semibold">WhatsApp Bot Creator</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {/* Train Bot with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsTrainMenuOpen(!isTrainMenuOpen)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <span>Train Bot</span>
                  </div>
                  {isTrainMenuOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </SidebarMenuButton>
                {isTrainMenuOpen && (
                  <SidebarMenuSub>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full justify-start text-sm mb-2"
                    >
                      + Add Bot
                    </Button>
                    {bots.map((bot) => (
                      <SidebarMenuSubItem key={bot.id}>
                        <SidebarMenuSubButton
                          onClick={() => {
                            setSelectedBot(bot.id);
                            setSelectedView("train");
                          }}
                          isActive={selectedBot === bot.id && selectedView === "train"}
                        >
                          {bot.name}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* Other menu items */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setSelectedView(item.id)}
                    isActive={selectedView === item.id}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset>
          <div className="p-6">
            <div className="flex justify-end mb-6">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            {renderMainContent()}
          </div>
        </SidebarInset>

        <CreateBotModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateBot={handleCreateBot}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
