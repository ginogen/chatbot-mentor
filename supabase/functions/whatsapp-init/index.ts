import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleAuth = async (authHeader: string | null) => {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
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

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    throw new Error(authError?.message || 'Unauthorized');
  }

  return { user, supabaseClient };
};

const updateConnection = async (supabaseClient: any, connectionId: string, qrCode: string) => {
  const { error } = await supabaseClient
    .from('whatsapp_connections')
    .update({
      qr_code: qrCode,
      qr_code_timestamp: new Date().toISOString(),
      status: 'pending'
    })
    .eq('id', connectionId);

  if (error) {
    throw new Error(`Database Error: ${error.message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate request
    const { supabaseClient } = await handleAuth(req.headers.get('Authorization'));

    // Get and validate connection ID
    const { connectionId } = await req.json();
    if (!connectionId) {
      throw new Error('Missing connectionId parameter');
    }

    console.log('Processing request for connection:', connectionId);

    // Generate mock QR code for testing
    const mockQRCode = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // Update connection with QR code
    await updateConnection(supabaseClient, connectionId, mockQRCode);

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'WhatsApp initialization started',
        connectionId,
        qr_code: mockQRCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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