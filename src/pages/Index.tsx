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
import { Eye, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [bots, setBots] = React.useState<BotType[]>([]);
  const [selectedBot, setSelectedBot] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<string>("train");
  const [isTrainMenuOpen, setIsTrainMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isPreviewChatOpen, setIsPreviewChatOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

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
        .maybeSingle();
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

  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 w-[280px] bg-[#13141C]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="h-full overflow-auto">
          <MainSidebar
            bots={bots}
            selectedBot={selectedBot}
            selectedView={selectedView}
            isTrainMenuOpen={isTrainMenuOpen}
            onCreateBot={() => {
              setIsCreateModalOpen(true);
            }}
            onBotSelect={setSelectedBot}
            onViewSelect={(view) => {
              setSelectedView(view);
            }}
            onTrainMenuToggle={() => setIsTrainMenuOpen(!isTrainMenuOpen)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#13141C]">
        <div className="hidden lg:block">
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
        </div>

        <SidebarInset className="flex flex-col w-full">
          <TopBar
            userDisplayName={getUserDisplayName()}
            onLogout={handleLogout}
            leftContent={<MobileSidebar />}
          />
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            <MainContent
              selectedBot={selectedBot}
              selectedView={selectedView}
            />
          </div>
        </SidebarInset>

        {!isMobile && (
          <button
            onClick={() => setIsPreviewChatOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 hover:bg-primary-light"
            title="Preview Chat"
          >
            <Eye className="w-6 h-6 text-primary-foreground" />
          </button>
        )}

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