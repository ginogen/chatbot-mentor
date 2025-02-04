import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContextPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContextPromptField({ value, onChange }: ContextPromptFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="context">Context Prompt</Label>
      <Textarea
        id="context"
        placeholder="Provide context and instructions for the bot..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
}