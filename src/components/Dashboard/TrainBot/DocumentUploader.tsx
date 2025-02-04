import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface Document {
  id?: string;
  file_name: string;
}

interface DocumentUploaderProps {
  files: File[];
  trainingDocs?: Document[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export function DocumentUploader({
  files,
  trainingDocs,
  onFileChange,
  onRemoveFile,
}: DocumentUploaderProps) {
  return (
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
              onClick={() => onRemoveFile(index)}
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
          onChange={onFileChange}
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
  );
}