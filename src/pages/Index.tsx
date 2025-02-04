import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BotCard } from "@/components/Dashboard/BotCard";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";
import { whatsappService } from "@/services/whatsappService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { botService, Bot } from "@/services/botService";

const Index = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBots();
    initializeWhatsApp();
  }, []);

  const loadBots = async () => {
    try {
      const loadedBots = await botService.getBots();
      setBots(loadedBots);
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
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Bot Creator</h1>
            <p className="text-gray-600 mt-2">
              Create and manage your WhatsApp chatbots easily
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {qrCode && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Connect WhatsApp</h2>
            <p className="mb-4">Scan this QR code with WhatsApp on your phone to connect:</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
              alt="WhatsApp QR Code"
              className="mx-auto"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BotCard isNew onClick={() => setIsCreateModalOpen(true)} />
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              name={bot.name}
              status={bot.status}
              whatsappStatus={bot.whatsapp_status}
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Bot management interface will be available soon!",
                });
              }}
            />
          ))}
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