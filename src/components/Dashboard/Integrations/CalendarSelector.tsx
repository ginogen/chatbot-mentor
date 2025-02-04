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

interface EventType {
  id: string;
  name: string;
  description?: string;
  length?: number;
}

interface CalendarSelectorProps {
  botId: string;
  integration: any;
  onUpdate: () => void;
}

export function CalendarSelector({ botId, integration, onUpdate }: CalendarSelectorProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEventTypes();
    if (integration.config?.selected_calendar) {
      setSelectedEventType(integration.config.selected_calendar);
    }
  }, [integration]);

  const loadEventTypes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cal-api', {
        body: { action: 'get_calendars', botId },
      });
      
      if (error) throw error;
      
      if (data?.eventTypes && Array.isArray(data.eventTypes)) {
        setEventTypes(data.eventTypes);
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from Cal.com API');
      }
    } catch (error) {
      console.error("Error loading event types:", error);
      toast({
        title: "Error",
        description: "Failed to load event types from Cal.com",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventTypeSelect = async (eventTypeId: string) => {
    try {
      const selectedType = eventTypes.find(type => type.id === eventTypeId);
      if (!selectedType) return;

      await integrationService.updateIntegrationConfig(botId, "cal", {
        selected_calendar: eventTypeId,
        calendar_name: selectedType.name,
      });
      
      setSelectedEventType(eventTypeId);
      onUpdate();
      
      toast({
        title: "Success",
        description: "Event type selection updated successfully",
      });
    } catch (error) {
      console.error("Error updating event type selection:", error);
      toast({
        title: "Error",
        description: "Failed to update event type selection",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading event types...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Select Event Type</h4>
      <Select
        value={selectedEventType}
        onValueChange={handleEventTypeSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an event type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name} {type.length && `(${type.length} min)`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}