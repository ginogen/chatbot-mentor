import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { makeWASocket, useMultiFileAuthState, Browsers } from "@whiskeysockets/baileys";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );

    // Get and validate connection ID
    const { connectionId } = await req.json();
    if (!connectionId) {
      throw new Error('Missing connectionId parameter');
    }

    console.log('Initializing WhatsApp connection:', connectionId);

    // Initialize WhatsApp connection
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${connectionId}`);
    
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
        const { error } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString(),
            status: 'pending'
          })
          .eq('id', connectionId);

        if (error) {
          console.error('Error updating QR code:', error);
        }
      }

      if (connection === 'open') {
        // Update connection status to connected
        const { error } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId);

        if (error) {
          console.error('Error updating connection status:', error);
        }
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

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
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});