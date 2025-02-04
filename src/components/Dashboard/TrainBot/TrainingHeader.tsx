import { Bot } from "lucide-react";

export function TrainingHeader() {
  return (
    <div className="flex items-center gap-4 pb-6 border-b">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Train Bot</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your bot's training parameters and upload training documents
        </p>
      </div>
    </div>
  );
}