import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'https://esm.sh/date-fns@2.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, botId, date, time } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Cal.com integration for the bot
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

    // Base URL for Cal.com API v1 (changed from v2)
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
        if (!date) throw new Error('Date is required for availability check');
        
        let checkDate;
        try {
          if (date === 'tomorrow') {
            checkDate = addMinutes(new Date(), 24 * 60);
          } else if (date === 'today') {
            checkDate = new Date();
          } else {
            checkDate = parseISO(date);
          }

          if (isNaN(checkDate.getTime())) {
            throw new Error('Invalid date value');
          }

          const start = startOfDay(checkDate);
          const end = endOfDay(checkDate);
          
          endpoint = `${baseUrl}/availability/${integration.config?.selected_calendar}`;
          const queryParams = new URLSearchParams({
            start: start.toISOString(),
            end: end.toISOString(),
          });
          endpoint += `?${queryParams.toString()}`;
          console.log('Checking availability for:', format(checkDate, 'yyyy-MM-dd'));
        } catch (error) {
          console.error('Date parsing error:', error);
          throw new Error('Invalid date format provided');
        }
        break;
      }

      case 'schedule': {
        if (!date || !time) throw new Error('Date and time are required for scheduling');
        
        try {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

          if (!dateRegex.test(date)) {
            throw new Error('Date must be in yyyy-MM-dd format');
          }

          if (!timeRegex.test(time)) {
            throw new Error('Time must be in HH:mm format');
          }

          const scheduledDate = parseISO(`${date}T${time}`);
          if (isNaN(scheduledDate.getTime())) {
            throw new Error('Invalid date or time combination');
          }

          endpoint = `${baseUrl}/bookings/${integration.config?.selected_calendar}`;
          method = 'POST';
          body = JSON.stringify({
            start: scheduledDate.toISOString(),
            end: addMinutes(scheduledDate, 30).toISOString(),
            name: "Meeting scheduled via bot",
            email: "user@example.com",
            timeZone: "UTC",
            language: "es",
          });

          console.log('Scheduling meeting for:', format(scheduledDate, 'yyyy-MM-dd HH:mm'));
        } catch (error) {
          console.error('Date/time parsing error:', error);
          throw new Error(`Invalid date or time format: ${error.message}`);
        }
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

    // Process the response based on the action
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
        date: format(parseISO(date), 'yyyy-MM-dd'),
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