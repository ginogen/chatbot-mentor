import { Bot, MessageSquare, Plug, BarChart, Calendar, CreditCard } from "lucide-react";
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
  currentView: "metrics" | "train" | "chat" | "connect" | "integrations";
  onViewChange: (view: "metrics" | "train" | "chat" | "connect" | "integrations") => void;
}

export function BotSidebar({ currentView, onViewChange }: BotSidebarProps) {
  const mainItems = [
    {
      title: "Metrics",
      icon: BarChart,
      value: "metrics" as const,
    },
    {
      title: "Train Bot",
      icon: Bot,
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

  const integrationItems = [
    {
      title: "Cal.com",
      icon: Calendar,
      service: "cal",
    },
    {
      title: "Calendly",
      icon: Calendar,
      service: "calendly",
    },
    {
      title: "MercadoPago",
      icon: CreditCard,
      service: "mercadopago",
    },
    {
      title: "PayPal",
      icon: CreditCard,
      service: "paypal",
    },
  ];

  const handleIntegrationClick = (service: string) => {
    onViewChange("integrations");
    // We'll implement the connection logic later
    console.log(`Connecting to ${service}`);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Bot Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Integrations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {integrationItems.map((item) => (
                <SidebarMenuItem key={item.service}>
                  <SidebarMenuButton
                    onClick={() => handleIntegrationClick(item.service)}
                    className={currentView === "integrations" ? "bg-muted" : ""}
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