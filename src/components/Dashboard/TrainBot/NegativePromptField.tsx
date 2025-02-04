import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NegativePromptFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function NegativePromptField({ value, onChange }: NegativePromptFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="negative">Negative Prompt</Label>
      <Textarea
        id="negative"
        placeholder="Specify what the bot should not do..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
}