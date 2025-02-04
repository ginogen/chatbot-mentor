import { useState, useEffect } from "react";
import { BotCard } from "@/components/Dashboard/BotCard";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { botService, Bot } from "@/services/botService";
import { TrainBotView } from "@/components/Dashboard/TrainBotView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveChatView } from "@/components/Dashboard/LiveChatView";
import { IntegrationsView } from "@/components/Dashboard/IntegrationsView";

const Index = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
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
      const qrCode = await whatsappService.getQRCode();
      setQrCode(qrCode);
      toast({
        title: "WhatsApp Connection",
        description: "Scan the QR code to connect WhatsApp",
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Bot Creator</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage your WhatsApp chatbots easily
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar with bots */}
          <div className="space-y-4">
            <BotCard isNew onClick={() => setIsCreateModalOpen(true)} />
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

          {/* Main content area */}
          <div className="md:col-span-3">
            {selectedBot ? (
              <Tabs defaultValue="train" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="train">Training</TabsTrigger>
                  <TabsTrigger value="chat">Live Chat</TabsTrigger>
                  <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>
                <TabsContent value="train">
                  <TrainBotView botId={selectedBot} />
                </TabsContent>
                <TabsContent value="chat">
                  <LiveChatView botId={selectedBot} />
                </TabsContent>
                <TabsContent value="integrations">
                  <IntegrationsView botId={selectedBot} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  Select a bot or create a new one to get started
                </p>
              </div>
            )}
          </div>
        </div>

        <CreateBotModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreateBot={handleCreateBot}
        />
      </div>
    </div>
  );
};

export default Index;