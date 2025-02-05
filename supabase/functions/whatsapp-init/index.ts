import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { makeWASocket, useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.5.0';
import { Boom } from 'npm:@hapi/boom@10.0.1';

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
      
      // Initialize WhatsApp client with auth state
      const { state, saveCreds } = await useMultiFileAuthState(`.auth_${connectionId}`);
      
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Chrome (Linux)', '', ''],
      });

      // Handle connection updates
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          console.log('QR Code received');
          // Update QR code in database
          await supabaseClient
            .from('whatsapp_connections')
            .update({
              qr_code: qr,
              qr_code_timestamp: new Date().toISOString(),
              status: 'connecting'
            })
            .eq('id', connectionId);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== 401;
          console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
          
          // Update connection status
          await supabaseClient
            .from('whatsapp_connections')
            .update({
              status: shouldReconnect ? 'connecting' : 'disconnected',
              qr_code: null,
              qr_code_timestamp: null
            })
            .eq('id', connectionId);
        } else if (connection === 'open') {
          console.log('Connection opened');
          
          // Update connection status and phone number
          await supabaseClient
            .from('whatsapp_connections')
            .update({
              status: 'connected',
              phone_number: sock.user?.id?.split(':')[0] || null,
              qr_code: null,
              qr_code_timestamp: null
            })
            .eq('id', connectionId);
        }
      });

      // Save credentials whenever they are updated
      sock.ev.on('creds.update', saveCreds);

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