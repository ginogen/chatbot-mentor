import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Client, LocalAuth } from "npm:whatsapp-web.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { botId } = await req.json();
    if (!botId) {
      throw new Error('Missing botId parameter');
    }

    // Verify the user owns this bot
    const { data: bot, error: botError } = await supabaseClient
      .from('bots')
      .select('*')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single();

    if (botError || !bot) {
      console.error('Bot access error:', botError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Bot not found or access denied' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      console.log('Initializing WhatsApp client...');
      
      const client = new Client({
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
          headless: true
        },
        authStrategy: new LocalAuth({
          clientId: botId
        })
      });

      client.on('qr', (qr) => {
        console.log('QR Code received:', qr);
      });

      client.on('ready', () => {
        console.log('Client is ready!');
      });

      client.on('auth_failure', (msg) => {
        console.error('Authentication failure:', msg);
      });

      console.log('Starting client initialization...');
      await client.initialize();
      console.log('Client initialized successfully');

      return new Response(
        JSON.stringify({ 
          status: 'initializing', 
          userId: user.id, 
          botId 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (whatsappError) {
      console.error('WhatsApp initialization error:', whatsappError);
      return new Response(
        JSON.stringify({ 
          error: 'WhatsApp initialization failed', 
          details: whatsappError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('authorization') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});