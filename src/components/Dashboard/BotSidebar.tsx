import { Robot, MessageSquare, Plug, BarChart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface BotSidebarProps {
  currentView: "metrics" | "train" | "chat" | "connect";
  onViewChange: (view: "metrics" | "train" | "chat" | "connect") => void;
}

export function BotSidebar({ currentView, onViewChange }: BotSidebarProps) {
  const items = [
    {
      title: "Metrics",
      icon: BarChart,
      value: "metrics" as const,
    },
    {
      title: "Train Bot",
      icon: Robot,
      value: "train" as const,
    },
    {
      title: "Live Chat",
      icon: MessageSquare,
      value: "chat" as const,
    },
    {
      title: "Connect",
      icon: Plug,
      value: "connect" as const,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Bot Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.value)}
                    className={currentView === item.value ? "bg-muted" : ""}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}