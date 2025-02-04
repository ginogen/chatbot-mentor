import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Base URL for Cal.com API v2
    const baseUrl = 'https://api.cal.com/v2';
    let endpoint = baseUrl;
    let method = 'GET';
    let body;
    
    switch (action) {
      case 'get_calendars':
        endpoint = `${baseUrl}/event-types`;
        break;
      case 'check_availability':
        if (!date) throw new Error('Date is required for availability check');
        endpoint = `${baseUrl}/schedules`;
        const queryParams = new URLSearchParams({
          startTime: `${date}T00:00:00Z`,
          endTime: `${date}T23:59:59Z`,
          ...(integration.config?.selected_calendar && {
            eventTypeId: integration.config.selected_calendar
          })
        });
        endpoint += `?${queryParams.toString()}`;
        break;
      case 'schedule':
        if (!date || !time) throw new Error('Date and time are required for scheduling');
        endpoint = `${baseUrl}/bookings`;
        method = 'POST';
        body = JSON.stringify({
          eventTypeId: integration.config?.selected_calendar,
          start: `${date}T${time}:00.000Z`,
          end: `${date}T${time}:30:00.000Z`, // Adding 30 minutes by default
          name: "Meeting scheduled via bot",
          email: "user@example.com", // This should be replaced with actual user email
          timeZone: "UTC",
          language: "es",
        });
        break;
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
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response from Cal.com API');
    }

    if (!response.ok) {
      console.error('Cal.com API error response:', responseData);
      throw new Error(`Cal.com API error: ${responseData.message || response.statusText}`);
    }

    console.log('Cal.com API response:', responseData);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in cal-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});