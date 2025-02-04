import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";

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
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-medium">New Documents</Label>
        <div className="grid gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="truncate font-medium">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveFile(index)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {trainingDocs && trainingDocs.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Uploaded Documents</Label>
          <div className="grid gap-4">
            {trainingDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="truncate font-medium text-muted-foreground">
                    {doc.file_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
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
          className="w-full h-24 border-dashed hover:border-primary hover:bg-primary/5"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6" />
            <span>Upload Documents</span>
            <span className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, TXT, or CSV
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}