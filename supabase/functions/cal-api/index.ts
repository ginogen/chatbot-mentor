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
      throw new Error('Cal.com integration not found or invalid');
    }

    let endpoint = 'https://api.cal.com/v1';
    let method = 'GET';
    let body;
    
    switch (action) {
      case 'get_calendars':
        endpoint += '/calendars';
        break;
      case 'check_availability':
        endpoint += `/availability?date=${date}`;
        if (integration.config?.selected_calendar) {
          endpoint += `&calendarId=${integration.config.selected_calendar}`;
        }
        break;
      case 'schedule':
        endpoint += '/bookings';
        method = 'POST';
        body = JSON.stringify({
          start: `${date}T${time}`,
          end: `${date}T${time}`, // You might want to add duration
          title: "Meeting scheduled via bot",
          calendarId: integration.config?.selected_calendar,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cal.com API error:', errorText);
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Cal.com API response:', data);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in cal-api function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});