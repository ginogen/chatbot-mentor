import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import React from "react";

interface TopBarProps {
  userDisplayName: string;
  onLogout: () => void;
  leftContent?: React.ReactNode;
}

export const TopBar = ({ userDisplayName, onLogout, leftContent }: TopBarProps) => {
  return (
    <div className="border-b border-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {leftContent}
          <h2 className="text-lg font-semibold text-gradient hidden sm:block">
            WhatsApp Bot Creator
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{userDisplayName}</span>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};