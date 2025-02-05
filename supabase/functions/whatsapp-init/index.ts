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
    console.log('WhatsApp initialization started');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message || 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connectionId } = await req.json();
    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', details: 'Missing connectionId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connection ID received:', connectionId);

    // Get the connection and verify ownership
    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*, bots!inner(user_id)')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Not Found', details: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (connection.bots.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'You do not have permission to access this connection' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('Initializing WhatsApp client...');
      
      // Configure WhatsApp client with improved settings
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
          clientId: connectionId,
          dataPath: `./.wwebjs_auth/${connectionId}`
        })
      });

      // Handle QR code generation
      client.on('qr', async (qr) => {
        console.log('QR Code received');
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString(),
            status: 'connecting'
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating QR code:', updateError);
        }
      });

      // Handle successful connection
      client.on('ready', async () => {
        console.log('Client ready!');
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            phone_number: client.info.wid.user
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating connection status:', updateError);
        }
      });

      // Handle authentication failures
      client.on('auth_failure', async (msg) => {
        console.error('Authentication failed:', msg);
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'disconnected',
            qr_code: null,
            qr_code_timestamp: null
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating connection status:', updateError);
        }
      });

      // Initialize the client
      await client.initialize();
      console.log('Client initialized successfully');

      return new Response(
        JSON.stringify({ 
          status: 'initializing',
          userId: user.id,
          connectionId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (whatsappError) {
      console.error('Error initializing WhatsApp:', whatsappError);
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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('authorization') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});