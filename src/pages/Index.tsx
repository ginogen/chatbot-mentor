import { useState } from "react";
import { BotCard } from "@/components/Dashboard/BotCard";
import { CreateBotModal } from "@/components/Dashboard/CreateBotModal";
import { useToast } from "@/components/ui/use-toast";

interface Bot {
  id: string;
  name: string;
  status: "active" | "inactive";
}

const Index = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateBot = (name: string) => {
    const newBot: Bot = {
      id: Date.now().toString(),
      name,
      status: "inactive",
    };
    setBots([...bots, newBot]);
    toast({
      title: "Success",
      description: "Bot created successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Bot Creator</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your WhatsApp chatbots easily
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BotCard isNew onClick={() => setIsCreateModalOpen(true)} />
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              name={bot.name}
              status={bot.status}
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