import React from "react";
import { Bot, MessageSquare, Plug, Settings, LogOut, User, Plug2 } from "lucide-react";
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
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    loadBots();
    initializeWhatsApp();
    loadUserProfile();
    loadUserEmail();
  }, []);

  const menuItems = [
    { id: "chat", label: "Live Chat", icon: MessageSquare },
    { id: "connect", label: "Connect", icon: Plug },
    { id: "integrations", label: "Integrations", icon: Plug2 },
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

  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || null);
    }
  };

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

  const getUserDisplayName = () => {
    if (userProfile?.first_name) {
      return userProfile.first_name + (userProfile.last_name ? ` ${userProfile.last_name}` : '');
    }
    return userEmail || 'User';
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-[#13141C]">
        <Sidebar className="sidebar-gradient border-r border-white/5">
          <SidebarHeader className="border-b border-white/5 p-4">
            <h2 className="text-lg font-semibold text-gradient">WhatsApp Bot Creator</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsTrainMenuOpen(!isTrainMenuOpen)}
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
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full justify-start text-sm mb-2 hover:bg-white/5"
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
                    onClick={() => setSelectedView(item.id)}
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

        <SidebarInset className="flex flex-col">
          <div className="w-full glass-effect p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <span className="text-white/90">{getUserDisplayName()}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-white/5"
            >
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