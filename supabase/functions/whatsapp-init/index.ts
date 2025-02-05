import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { QRCodeGenerator } from "https://deno.land/x/qrcode/mod.ts";

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
    
    // Generate QR code using Deno QR code generator
    const qrCode = new QRCodeGenerator();
    const qrCodeSvg = await qrCode.generate(qrData, {
      errorCorrectionLevel: 'H',
      type: 'svg',
      margin: 1,
    });

    // Convert SVG to data URL
    const qrCodeDataUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;
    
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