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
    const { action, botId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener la integración de Cal.com para el bot
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
    
    switch (action) {
      case 'get_calendars':
        endpoint += '/calendars';
        break;
      default:
        throw new Error('Invalid action');
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${integration.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});