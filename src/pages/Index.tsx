import { useState, useEffect } from "react";
import { BotCard } from "@/components/Dashboard/BotCard";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wrench, Plug2, Settings, LogOut } from "lucide-react";
import { botService, Bot } from "@/services/botService";
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
} from "@/components/ui/sidebar";

const Index = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<string>("train");
  const [showBotsSidebar, setShowBotsSidebar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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

  const handleDeleteBot = async (botId: string) => {
    try {
      await botService.deleteBot(botId);
      setBots(bots.filter(bot => bot.id !== botId));
      if (selectedBot === botId) {
        setSelectedBot(bots[0]?.id || null);
      }
      toast({
        title: "Success",
        description: "Bot deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bot. Please try again.",
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
    { id: "train", label: "Train Bot", icon: Wrench },
    { id: "integrations", label: "Integrations", icon: Plug2 },
    { id: "settings", label: "Settings", icon: Settings },
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
        {/* Main Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-border p-4">
            <h2 className="text-lg font-semibold">WhatsApp Bot Creator</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      setSelectedView(item.id);
                      if (item.id === "train") {
                        setShowBotsSidebar(true);
                      }
                    }}
                    isActive={selectedView === item.id}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Bots Sidebar */}
        {showBotsSidebar && (
          <Sidebar variant="floating" className="w-72 border-r border-border">
            <SidebarHeader className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your Bots</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Add Bot
                </Button>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-4">
              <div className="space-y-3">
                {bots.map((bot) => (
                  <BotCard
                    key={bot.id}
                    id={bot.id}
                    name={bot.name}
                    status={bot.status}
                    whatsappStatus={bot.whatsapp_status}
                    onClick={() => setSelectedBot(bot.id)}
                    isSelected={selectedBot === bot.id}
                  />
                ))}
              </div>
            </SidebarContent>
          </Sidebar>
        )}

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