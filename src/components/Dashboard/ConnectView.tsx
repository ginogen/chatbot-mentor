import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { whatsappService, type WhatsAppConnection } from "@/services/whatsappService";
import { Plus, Trash2, Phone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConnectViewProps {
  botId: string;
}

export function ConnectView({ botId }: ConnectViewProps) {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [botId]);

  const loadConnections = async () => {
    try {
      const data = await whatsappService.getConnections(botId);
      setConnections(data);
    } catch (error) {
      console.error("Failed to load connections:", error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    try {
      const newConnection = await whatsappService.createConnection(botId);
      setConnections([...connections, newConnection]);
      toast({
        title: "Success",
        description: "New WhatsApp connection created",
      });
    } catch (error) {
      console.error("Failed to add connection:", error);
      toast({
        title: "Error",
        description: "Failed to create WhatsApp connection",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      await whatsappService.deleteConnection(connectionId);
      setConnections(connections.filter((conn) => conn.id !== connectionId));
      toast({
        title: "Success",
        description: "WhatsApp connection deleted",
      });
    } catch (error) {
      console.error("Failed to delete connection:", error);
      toast({
        title: "Error",
        description: "Failed to delete WhatsApp connection",
        variant: "destructive",
      });
    }
  };

  const loadAvailableNumbers = async () => {
    try {
      const numbers = await whatsappService.listAvailableNumbers();
      setAvailableNumbers(numbers);
    } catch (error) {
      console.error("Failed to load available numbers:", error);
      toast({
        title: "Error",
        description: "Failed to load available phone numbers",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseNumber = async (connectionId: string) => {
    try {
      setIsPurchasing(true);
      await whatsappService.purchaseNumber(connectionId);
      await loadConnections();
      toast({
        title: "Success",
        description: "Phone number purchased successfully",
      });
    } catch (error) {
      console.error("Failed to purchase number:", error);
      toast({
        title: "Error",
        description: "Failed to purchase phone number",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
        <Button onClick={handleAddConnection}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((connection) => (
          <Card key={connection.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {connection.phone_number || "New Connection"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Status: {connection.status}
                </p>
                {connection.monthly_cost > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Monthly Cost: ${connection.monthly_cost}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {!connection.phone_number && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={loadAvailableNumbers}>
                        <Phone className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Purchase Phone Number</DialogTitle>
                        <DialogDescription>
                          Select a phone number to purchase for your WhatsApp Business account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Select
                          value={selectedNumber}
                          onValueChange={setSelectedNumber}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a phone number" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNumbers.map((number) => (
                              <SelectItem key={number.phoneNumber} value={number.phoneNumber}>
                                {number.phoneNumber} - ${number.price}/month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchaseNumber(connection.id)}
                          disabled={isPurchasing || !selectedNumber}
                        >
                          {isPurchasing ? "Purchasing..." : "Purchase Number"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this WhatsApp connection?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteConnection(connection.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}