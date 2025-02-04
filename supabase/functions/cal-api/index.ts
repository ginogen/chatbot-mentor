import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addMinutes, startOfDay, endOfDay, addDays, setHours, setMinutes } from 'https://esm.sh/date-fns@2.30.0';
import { es } from 'https://esm.sh/date-fns@2.30.0/locale';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseNaturalDate = (dateStr: string): Date | null => {
  const now = new Date();
  dateStr = dateStr.toLowerCase().trim();

  if (dateStr.includes('mañana')) {
    const tomorrow = addDays(now, 1);
    const timeMatch = dateStr.match(/(\d{1,2})(?:\s*)?(?:am|pm)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      if (dateStr.includes('pm') && hours < 12) hours += 12;
      return setHours(setMinutes(tomorrow, 0), hours);
    }
    return tomorrow;
  }

  const weekdays = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
  };

  for (const [day, value] of Object.entries(weekdays)) {
    if (dateStr.includes(day)) {
      let targetDate = now;
      while (targetDate.getDay() !== value) {
        targetDate = addDays(targetDate, 1);
      }
      const timeMatch = dateStr.match(/(\d{1,2})(?:\s*)?(?:am|pm)/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        if (dateStr.includes('pm') && hours < 12) hours += 12;
        return setHours(setMinutes(targetDate, 0), hours);
      }
      return targetDate;
    }
  }

  const monthNames = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };

  for (const [month, value] of Object.entries(monthNames)) {
    if (dateStr.includes(month)) {
      const dayMatch = dateStr.match(/(\d{1,2})/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        const date = new Date(now.getFullYear(), value, day);
        const timeMatch = dateStr.match(/(\d{1,2})(?:\s*)?(?:am|pm)/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          if (dateStr.includes('pm') && hours < 12) hours += 12;
          return setHours(setMinutes(date, 0), hours);
        }
        return date;
      }
    }
  }

  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, botId, date: rawDate } = await req.json();
    console.log('Received request:', { action, botId, rawDate });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: integration, error: integrationError } = await supabase
      .from('bot_integrations')
      .select('*')
      .eq('bot_id', botId)
      .eq('service_name', 'cal')
      .maybeSingle();

    if (integrationError || !integration?.api_key) {
      console.error('Integration error:', integrationError);
      throw new Error('Cal.com integration not found or invalid');
    }

    const baseUrl = 'https://api.cal.com/v1';
    let endpoint = baseUrl;
    let method = 'GET';
    let body;
    let responseData;
    
    switch (action) {
      case 'get_calendars':
        endpoint = `${baseUrl}/event-types`;
        console.log('Fetching event types from:', endpoint);
        break;

      case 'check_availability': {
        if (!rawDate) throw new Error('Date is required for availability check');
        
        const parsedDate = parseNaturalDate(rawDate);
        if (!parsedDate) {
          throw new Error('No se pudo interpretar la fecha proporcionada');
        }

        console.log('Parsed date:', parsedDate);
        
        const start = startOfDay(parsedDate);
        const end = endOfDay(parsedDate);
        
        if (!integration.config?.selected_calendar) {
          throw new Error('No calendar selected');
        }

        endpoint = `${baseUrl}/availability/${integration.config.selected_calendar}`;
        const queryParams = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
        });
        endpoint += `?${queryParams.toString()}`;
        console.log('Checking availability for:', format(parsedDate, 'yyyy-MM-dd', { locale: es }));
        break;
      }

      case 'schedule': {
        if (!rawDate) throw new Error('Date and time are required for scheduling');
        
        const parsedDate = parseNaturalDate(rawDate);
        if (!parsedDate) {
          throw new Error('No se pudo interpretar la fecha proporcionada');
        }

        if (!integration.config?.selected_calendar) {
          throw new Error('No calendar selected');
        }

        endpoint = `${baseUrl}/bookings`;
        method = 'POST';
        body = JSON.stringify({
          eventTypeId: parseInt(integration.config.selected_calendar),
          start: parsedDate.toISOString(),
          end: addMinutes(parsedDate, 30).toISOString(),
          name: "Meeting scheduled via bot",
          email: "user@example.com",
          timeZone: "UTC",
          language: "es",
        });

        console.log('Scheduling meeting for:', format(parsedDate, 'yyyy-MM-dd HH:mm', { locale: es }));
        break;
      }

      default:
        throw new Error('Invalid action');
    }

    console.log(`Making ${method} request to ${endpoint}`);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? body : undefined,
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    try {
      responseData = JSON.parse(responseText);
      console.log('Cal.com API response:', responseData);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from Cal.com API');
    }

    if (!response.ok) {
      console.error('Cal.com API error response:', responseData);
      throw new Error(`Cal.com API error: ${responseData.message || response.statusText}`);
    }

    if (action === 'get_calendars') {
      const eventTypes = Array.isArray(responseData) ? responseData.map(eventType => ({
        id: eventType.id.toString(),
        name: eventType.title || eventType.name,
        description: eventType.description,
        length: eventType.length,
      })) : [];
      
      console.log('Processed event types:', eventTypes);
      responseData = { eventTypes };
    } else if (action === 'check_availability') {
      const slots = responseData.busy || [];
      const availableSlots = [];
      const startTime = 9; // 9 AM
      const endTime = 17; // 5 PM

      for (let hour = startTime; hour < endTime; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        const isAvailable = !slots.some((slot: any) => {
          const slotTime = new Date(slot.start).getHours();
          return slotTime === hour;
        });

        if (isAvailable) {
          availableSlots.push(timeSlot);
        }
      }

      responseData = { 
        date: format(parseNaturalDate(rawDate)!, 'yyyy-MM-dd', { locale: es }),
        availableSlots 
      };
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in cal-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});