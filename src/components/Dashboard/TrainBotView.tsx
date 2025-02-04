import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ContextPromptField } from "./TrainBot/ContextPromptField";
import { NegativePromptField } from "./TrainBot/NegativePromptField";
import { TemperatureSelector } from "./TrainBot/TemperatureSelector";
import { DocumentUploader } from "./TrainBot/DocumentUploader";
import { Bot } from "lucide-react";

interface TrainBotViewProps {
  botId: string;
}

export function TrainBotView({ botId }: TrainBotViewProps) {
  const [contextPrompt, setContextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { data: trainingData } = useQuery({
    queryKey: ["botTraining", botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_training")
        .select("*")
        .eq("bot_id", botId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: trainingDocs } = useQuery({
    queryKey: ["trainingDocs", botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_documents")
        .select("*")
        .eq("bot_id", botId);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (trainingData) {
      setContextPrompt(trainingData.context_prompt || "");
      setNegativePrompt(trainingData.negative_prompt || "");
      setTemperature(trainingData.temperature?.toString() || "0.7");
    }
  }, [trainingData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!contextPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide a context prompt for the bot",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // First check if a record exists
      const { data: existingTraining } = await supabase
        .from("bot_training")
        .select("id")
        .eq("bot_id", botId)
        .maybeSingle();

      if (existingTraining) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("bot_training")
          .update({
            context_prompt: contextPrompt,
            negative_prompt: negativePrompt,
            temperature: parseFloat(temperature),
          })
          .eq("bot_id", botId);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("bot_training")
          .insert({
            bot_id: botId,
            context_prompt: contextPrompt,
            negative_prompt: negativePrompt,
            temperature: parseFloat(temperature),
          });

        if (insertError) throw insertError;
      }

      // Handle file uploads
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${botId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("training_docs")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase
          .from("training_documents")
          .insert({
            bot_id: botId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
          });

        if (docError) throw docError;
      }

      toast({
        title: "Success",
        description: "Bot training configuration saved successfully",
      });

      setFiles([]);
    } catch (error) {
      console.error("Error saving training configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save training configuration",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Train Bot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure your bot's training parameters and upload training documents</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <ContextPromptField value={contextPrompt} onChange={setContextPrompt} />
              <NegativePromptField value={negativePrompt} onChange={setNegativePrompt} />
            </div>
            <div className="space-y-8">
              <TemperatureSelector value={temperature} onChange={setTemperature} />
              <DocumentUploader
                files={files}
                trainingDocs={trainingDocs}
                onFileChange={handleFileChange}
                onRemoveFile={removeFile}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={uploading} 
            className="w-full transition-all duration-300 hover:translate-y-[-2px]"
          >
            {uploading ? "Saving..." : "Save Training Configuration"}
          </Button>
        </div>
      </div>
    </Card>
  );
}