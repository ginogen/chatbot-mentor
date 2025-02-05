import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Client, LocalAuth } from "npm:whatsapp-web.js";

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
      console.error('Falta el header de autorización');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: 'Falta el header de autorización' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: authError?.message || 'Usuario no autenticado' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { connectionId } = await req.json();
    if (!connectionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          details: 'Falta el parámetro connectionId' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      console.error('Error de conexión:', connectionError);
      return new Response(
        JSON.stringify({ 
          error: 'Not Found', 
          details: 'Conexión no encontrada' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: bot, error: botError } = await supabaseClient
      .from('bots')
      .select('*')
      .eq('id', connection.bot_id)
      .eq('user_id', user.id)
      .single();

    if (botError || !bot) {
      console.error('Error de acceso al bot:', botError);
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden', 
          details: 'Bot no encontrado o acceso denegado' 
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      console.log('Inicializando cliente de WhatsApp...');
      
      const client = new Client({
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
          headless: true
        },
        authStrategy: new LocalAuth({
          clientId: connectionId
        })
      });

      client.on('qr', async (qr) => {
        console.log('Código QR recibido');
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString(),
            status: 'connecting'
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error al actualizar el código QR:', updateError);
        }
      });

      client.on('ready', async () => {
        console.log('Cliente listo!');
        const { error: updateError } = await supabaseClient
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            phone_number: client.info.wid.user
          })
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error al actualizar el estado de la conexión:', updateError);
        }
      });

      await client.initialize();
      console.log('Cliente inicializado exitosamente');

      return new Response(
        JSON.stringify({ 
          status: 'initializing', 
          userId: user.id, 
          connectionId 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (whatsappError) {
      console.error('Error al inicializar WhatsApp:', whatsappError);
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
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('authorization') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});