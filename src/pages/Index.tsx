import React from "react";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { botService, Bot as BotType } from "@/services/botService";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/Layout/MainSidebar";
import { TopBar } from "@/components/Layout/TopBar";
import { MainContent } from "@/components/Layout/MainContent";
import { PreviewChat } from "@/components/Dashboard/PreviewChat";
import { Eye } from "lucide-react";

const Index = () => {
  const [bots, setBots] = React.useState<BotType[]>([]);
  const [selectedBot, setSelectedBot] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<string>("train");
  const [isTrainMenuOpen, setIsTrainMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isPreviewChatOpen, setIsPreviewChatOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    loadBots();
    loadUserProfile();
    loadUserEmail();
  }, []);

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
        await initializeWhatsApp(loadedBots[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bots. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeWhatsApp = async (botId: string) => {
    try {
      await whatsappService.initialize(botId);
      toast({
        title: "WhatsApp Connection",
        description: "WhatsApp service initialized successfully",
      });
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#13141C]">
        <MainSidebar
          bots={bots}
          selectedBot={selectedBot}
          selectedView={selectedView}
          isTrainMenuOpen={isTrainMenuOpen}
          onCreateBot={() => setIsCreateModalOpen(true)}
          onBotSelect={setSelectedBot}
          onViewSelect={setSelectedView}
          onTrainMenuToggle={() => setIsTrainMenuOpen(!isTrainMenuOpen)}
        />

        <SidebarInset className="flex flex-col">
          <TopBar
            userDisplayName={getUserDisplayName()}
            onLogout={handleLogout}
          />
          <div className="flex-1 p-6 overflow-auto">
            <MainContent
              selectedBot={selectedBot}
              selectedView={selectedView}
            />
          </div>
        </SidebarInset>

        {/* Floating Preview Button - Always visible */}
        <button
          onClick={() => setIsPreviewChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 hover:bg-primary-light"
          title="Preview Chat"
        >
          <Eye className="w-6 h-6 text-primary-foreground" />
        </button>

        {selectedBot && (
          <PreviewChat
            open={isPreviewChatOpen}
            onOpenChange={setIsPreviewChatOpen}
            botId={selectedBot}
            botName={bots.find(bot => bot.id === selectedBot)?.name || "Bot Preview"}
          />
        )}

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