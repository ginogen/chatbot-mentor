import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { Client } from 'npm:whatsapp-web.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const client = new Client({});
    
    client.on('qr', (qr) => {
      // Store QR code for later retrieval
      // You might want to store this in Supabase database
      console.log('QR RECEIVED', qr);
    });

    client.on('ready', () => {
      console.log('Client is ready!');
    });

    await client.initialize();

    return new Response(
      JSON.stringify({ status: 'initializing' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});