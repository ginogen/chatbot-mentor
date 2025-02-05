import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

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

    // Generate a unique QR code data
    const qrData = `whatsapp-connection:${connectionId}-${Date.now()}`;
    
    // Generate QR code as data URL with specific options for better visibility
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    console.log('Generated QR code for connection:', connectionId);

    // Update the connection with the QR code
    const { error: qrUpdateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        qr_code: qrCodeDataUrl,
        qr_code_timestamp: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (qrUpdateError) {
      console.error('Error updating QR code:', qrUpdateError);
      throw qrUpdateError;
    }

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'WhatsApp initialization started',
        connectionId,
        qrCode: qrCodeDataUrl
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