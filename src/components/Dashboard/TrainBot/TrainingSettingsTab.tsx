import { ContextPromptField } from "./ContextPromptField";
import { NegativePromptField } from "./NegativePromptField";
import { TemperatureSelector } from "./TemperatureSelector";

interface TrainingSettingsTabProps {
  contextPrompt: string;
  negativePrompt: string;
  temperature: string;
  setContextPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  setTemperature: (value: string) => void;
}

export function TrainingSettingsTab({
  contextPrompt,
  negativePrompt,
  temperature,
  setContextPrompt,
  setNegativePrompt,
  setTemperature,
}: TrainingSettingsTabProps) {
  return (
    <div className="space-y-6">
      <ContextPromptField value={contextPrompt} onChange={setContextPrompt} />
      <NegativePromptField value={negativePrompt} onChange={setNegativePrompt} />
      <TemperatureSelector value={temperature} onChange={setTemperature} />
    </div>
  );
}