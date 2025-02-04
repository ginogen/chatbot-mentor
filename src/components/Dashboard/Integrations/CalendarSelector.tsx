import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { integrationService } from "@/services/integrationService";
import { supabase } from "@/integrations/supabase/client";

interface Calendar {
  id: string;
  name: string;
}

interface CalendarSelectorProps {
  botId: string;
  integration: any;
  onUpdate: () => void;
}

export function CalendarSelector({ botId, integration, onUpdate }: CalendarSelectorProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCalendars();
    if (integration.config?.selected_calendar) {
      setSelectedCalendar(integration.config.selected_calendar);
    }
  }, [integration]);

  const loadCalendars = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cal-api', {
        body: { action: 'get_calendars', botId },
      });
      
      if (error) throw error;
      
      setCalendars(data.calendars.map((cal: any) => ({
        id: cal.id,
        name: cal.name,
      })));
    } catch (error) {
      console.error("Error loading calendars:", error);
      toast({
        title: "Error",
        description: "Failed to load calendars from Cal.com",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarSelect = async (calendarId: string) => {
    try {
      const selectedCal = calendars.find(cal => cal.id === calendarId);
      if (!selectedCal) return;

      await integrationService.updateIntegrationConfig(botId, "cal", {
        selected_calendar: calendarId,
        calendar_name: selectedCal.name,
      });
      
      setSelectedCalendar(calendarId);
      onUpdate();
      
      toast({
        title: "Success",
        description: "Calendar selection updated successfully",
      });
    } catch (error) {
      console.error("Error updating calendar selection:", error);
      toast({
        title: "Error",
        description: "Failed to update calendar selection",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading calendars...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Select Calendar</h4>
      <Select
        value={selectedCalendar}
        onValueChange={handleCalendarSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a calendar" />
        </SelectTrigger>
        <SelectContent>
          {calendars.map((calendar) => (
            <SelectItem key={calendar.id} value={calendar.id}>
              {calendar.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}