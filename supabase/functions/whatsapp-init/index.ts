import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeWASocket, useMultiFileAuthState, Browsers } from "https://esm.sh/@whiskeysockets/baileys@6.5.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );

    // Get the JWT and verify it
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authentication');
    }

    // Get and validate connection ID from request body
    const { connectionId } = await req.json();
    if (!connectionId) {
      throw new Error('Missing connectionId parameter');
    }

    console.log('Initializing WhatsApp connection:', connectionId);

    // Create a simple in-memory state handler
    const state = {
      creds: null,
      keys: {},
    };

    const saveState = async (data: any) => {
      state.creds = data.creds;
      state.keys = data.keys;
      
      // Save state to Supabase
      const { error: updateError } = await supabaseClient
        .from('whatsapp_connections')
        .update({
          session_data: state,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Error saving state:', updateError);
      }
    };

    const sock = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: true
    });

    // Handle connection update
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('Connection update:', update);

      if (qr) {
        // Update connection with QR code
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
      }

      if (connection === 'open') {
        // Update connection status to connected
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

    // Handle credentials update
    sock.ev.on('creds.update', saveState);

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'WhatsApp initialization started',
        connectionId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: error instanceof Error && error.message.includes('Invalid authentication') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});