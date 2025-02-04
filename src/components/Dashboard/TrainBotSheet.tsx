import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TrainBotSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId: string;
}

export const TrainBotSheet = ({
  open,
  onOpenChange,
  botId,
}: TrainBotSheetProps) => {
  const [contextPrompt, setContextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Fetch existing training data
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
    enabled: open, // Only fetch when sheet is open
  });

  // Fetch existing training documents
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
    enabled: open, // Only fetch when sheet is open
  });

  // Update form when training data is loaded
  useEffect(() => {
    if (trainingData) {
      setContextPrompt(trainingData.context_prompt || "");
      setNegativePrompt(trainingData.negative_prompt || "");
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

      // Save or update training configuration
      const { error: trainingError } = await supabase
        .from("bot_training")
        .upsert({
          bot_id: botId,
          context_prompt: contextPrompt,
          negative_prompt: negativePrompt,
        });

      if (trainingError) throw trainingError;

      // Upload files
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

      onOpenChange(false);
      setFiles([]);
    } catch (error) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Train Bot</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="context">Context Prompt</Label>
            <Textarea
              id="context"
              placeholder="Provide context and instructions for the bot..."
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="negative">Negative Prompt</Label>
            <Textarea
              id="negative"
              placeholder="Specify what the bot should not do..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-4">
            <Label>Training Documents</Label>
            <div className="grid gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {trainingDocs?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 border rounded bg-gray-50"
                >
                  <span className="truncate">{doc.file_name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.csv"
                className="hidden"
                id="file-upload"
                multiple
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={uploading} className="w-full">
            {uploading ? "Saving..." : "Save Training Configuration"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};