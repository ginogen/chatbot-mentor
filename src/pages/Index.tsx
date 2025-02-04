import React from "react";
import { Bot, MessageSquare, Plug, Settings, LogOut, User } from "lucide-react";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { botService, Bot as BotType } from "@/services/botService";
import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { IntegrationsView } from "@/components/Dashboard/IntegrationsView";
import { ConnectView } from "@/components/Dashboard/ConnectView";
import { SettingsView } from "@/components/Dashboard/SettingsView";
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
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    loadBots();
    initializeWhatsApp();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .single();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

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
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderMainContent = () => {
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

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <Sidebar>
          <SidebarHeader className="border-b border-border p-4">
            <h2 className="text-lg font-semibold">WhatsApp Bot Creator</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsTrainMenuOpen(!isTrainMenuOpen)}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <span>Train Bot</span>
                  </div>
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

        <SidebarInset className="flex flex-col">
          <div className="w-full bg-white dark:bg-gray-800 border-b border-border p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{userProfile?.first_name || userProfile?.email || 'User'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-auto">
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
