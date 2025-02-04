import { Settings, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingSettingsTab } from "./TrainingSettingsTab";
import { DocumentUploader } from "./DocumentUploader";
import { TrainingDocument } from "../../../types/training";

interface TrainingTabsProps {
  contextPrompt: string;
  negativePrompt: string;
  temperature: string;
  files: File[];
  trainingDocs?: TrainingDocument[];
  setContextPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  setTemperature: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export function TrainingTabs({
  contextPrompt,
  negativePrompt,
  temperature,
  files,
  trainingDocs,
  setContextPrompt,
  setNegativePrompt,
  setTemperature,
  onFileChange,
  onRemoveFile,
}: TrainingTabsProps) {
  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Training Settings
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Training Documents
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="settings" className="mt-6">
        <TrainingSettingsTab
          contextPrompt={contextPrompt}
          negativePrompt={negativePrompt}
          temperature={temperature}
          setContextPrompt={setContextPrompt}
          setNegativePrompt={setNegativePrompt}
          setTemperature={setTemperature}
        />
      </TabsContent>
      
      <TabsContent value="documents" className="mt-6">
        <DocumentUploader
          files={files}
          trainingDocs={trainingDocs}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />
      </TabsContent>
    </Tabs>
  );
}