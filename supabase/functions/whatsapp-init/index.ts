import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import QRCode from "qrcode";
import WebSocket from "ws";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );

    const { connectionId } = await req.json();
    if (!connectionId) {
      throw new Error('Missing connectionId parameter');
    }

    console.log('Initializing WhatsApp connection:', connectionId);

    // Update connection status to connecting
    const { error: updateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (updateError) {
      console.error('Error updating connection status:', updateError);
      throw updateError;
    }

    // Generate a temporary QR code
    const qrData = `whatsapp-connection-${connectionId}-${Date.now()}`;
    const qrDataUrl = await QRCode.toDataURL(qrData);

    // Update the connection with the QR code
    const { error: qrUpdateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        qr_code: qrDataUrl,
        qr_code_timestamp: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (qrUpdateError) {
      console.error('Error updating QR code:', qrUpdateError);
      throw qrUpdateError;
    }

    // Set up WebSocket connection
    const ws = new WebSocket('wss://web.whatsapp.com/ws');

    ws.on('open', async () => {
      console.log('WebSocket connection opened');
      await supabaseClient
        .from('whatsapp_connections')
        .update({
          status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      await supabaseClient
        .from('whatsapp_connections')
        .update({
          status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

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