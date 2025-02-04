import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TemperatureSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TemperatureSelector({ value, onChange }: TemperatureSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="temperature">Temperature</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select temperature" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.1">0.1 - Very focused</SelectItem>
          <SelectItem value="0.3">0.3 - Focused</SelectItem>
          <SelectItem value="0.5">0.5 - Balanced</SelectItem>
          <SelectItem value="0.7">0.7 - Creative</SelectItem>
          <SelectItem value="0.9">0.9 - Very creative</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}