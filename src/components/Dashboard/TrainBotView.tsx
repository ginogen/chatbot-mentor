import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrainingHeader } from "./TrainBot/TrainingHeader";
import { TrainingTabs } from "./TrainBot/TrainingTabs";

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

  const { data: trainingDocs, refetch: refetchDocs } = useQuery({
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

  const processDocument = async (documentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-document', {
        body: { documentId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    }
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

      const { data: existingTraining } = await supabase
        .from("bot_training")
        .select("id")
        .eq("bot_id", botId)
        .maybeSingle();

      if (existingTraining) {
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

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${botId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("training_docs")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from("training_documents")
          .insert({
            bot_id: botId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
          })
          .select()
          .single();

        if (docError) throw docError;

        // Trigger document processing
        await processDocument(docData.id);
      }

      toast({
        title: "Success",
        description: "Bot training configuration saved successfully",
      });

      setFiles([]);
      refetchDocs();
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
        <TrainingHeader />
        
        <TrainingTabs
          contextPrompt={contextPrompt}
          negativePrompt={negativePrompt}
          temperature={temperature}
          files={files}
          trainingDocs={trainingDocs}
          setContextPrompt={setContextPrompt}
          setNegativePrompt={setNegativePrompt}
          setTemperature={setTemperature}
          onFileChange={handleFileChange}
          onRemoveFile={removeFile}
          onRefetchDocs={refetchDocs}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={uploading} 
          className="w-full transition-all duration-300 hover:translate-y-[-2px]"
        >
          {uploading ? "Saving..." : "Save Training Configuration"}
        </Button>
      </div>
    </Card>
  );
}