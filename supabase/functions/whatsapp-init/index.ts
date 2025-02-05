import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";

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

    // Initialize WhatsApp connection
    const logger = pino({ level: 'silent' });
    
    const sock = makeWASocket({
      printQRInTerminal: true,
      logger,
      auth: {
        creds: {} as any,
        keys: {} as any
      },
      browser: ['Chrome (Linux)', '', ''],
      connectTimeoutMs: 60_000,
      qrTimeout: 40_000,
    });

    // Handle connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('Connection update:', update);
      
      if (qr) {
        try {
          console.log('New QR code received');
          // Generate QR code as data URL
          const qrDataUrl = await QRCode.toDataURL(qr);

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
        } catch (error) {
          console.error('Error generating QR code:', error);
          throw error;
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed. Status code:', statusCode, 'Reconnect:', shouldReconnect);
        
        await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId);
      } else if (connection === 'open') {
        console.log('Connection opened successfully');
        
        await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectionId);
      }
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