import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  userDisplayName: string;
  onLogout: () => void;
}

export const TopBar = ({ userDisplayName, onLogout }: TopBarProps) => {
  return (
    <div className="w-full glass-effect p-4 flex justify-between items-center border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
        <span className="text-white/90 font-medium">{userDisplayName}</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onLogout}
        className="hover:bg-white/5 text-white/80 hover:text-white"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};