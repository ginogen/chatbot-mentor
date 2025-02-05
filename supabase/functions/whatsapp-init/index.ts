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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with auth context
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

    // Get the connection ID from the request body
    const { connectionId } = await req.json();
    if (!connectionId) {
      console.error('Missing connectionId parameter');
      return new Response(
        JSON.stringify({ error: 'Bad Request', details: 'Missing connectionId parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the WhatsApp connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Not Found', details: 'Connection not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the bot to verify ownership
    const { data: bot, error: botError } = await supabaseClient
      .from('bots')
      .select('*')
      .eq('id', connection.bot_id)
      .eq('user_id', user.id)
      .single();

    if (botError || !bot) {
      console.error('Bot access error:', botError);
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'Bot not found or access denied' }),
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
          clientId: connectionId
        })
      });

      client.on('qr', async (qr) => {
        console.log('QR Code received');
        // Update the QR code in the database
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString(),
            status: 'connecting'
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Failed to update QR code:', updateError);
        }
      });

      client.on('ready', async () => {
        console.log('Client is ready!');
        // Update connection status
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            phone_number: client.info.wid.user
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Failed to update connection status:', updateError);
        }
      });

      client.on('auth_failure', async (msg) => {
        console.error('Authentication failure:', msg);
        // Update connection status
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'disconnected'
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Failed to update connection status:', updateError);
        }
      });

      console.log('Starting client initialization...');
      await client.initialize();
      console.log('Client initialized successfully');

      return new Response(
        JSON.stringify({ 
          status: 'initializing', 
          userId: user.id, 
          connectionId 
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