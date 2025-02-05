import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from 'npm:@whiskeysockets/baileys';
import { Boom } from 'npm:@hapi/boom';
import { join } from "https://deno.land/std@0.188.0/path/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WhatsApp initialization started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

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

    // Create auth state directory for this connection
    const authPath = `auth_info_${connectionId}`;
    try {
      await Deno.mkdir(authPath, { recursive: true });
    } catch (error) {
      console.log('Auth directory already exists or error creating:', error);
    }

    // Initialize WhatsApp connection
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Lovable Bot', 'Chrome', '1.0.0'],
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('QR Code received:', qr);
        
        // Update connection with QR code
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connecting',
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString()
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating QR code:', updateError);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);

        // Update connection status
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating connection status:', updateError);
        }
      } else if (connection === 'open') {
        console.log('Connection opened');
        
        // Update connection status
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating connection status:', updateError);
        }
      }
    });

    // Save credentials when they're updated
    sock.ev.on('creds.update', saveCreds);

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'WhatsApp initialization started',
        connectionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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