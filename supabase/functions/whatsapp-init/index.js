import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { makeWASocket, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys'
import qrcode from 'qrcode'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { botId } = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { auth, saveCreds, removeCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
      auth,
      printQRInTerminal: true,
      browser: Browsers.ubuntu('Chrome'),
    })

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      
      if (qr) {
        // Convert QR to base64 image
        const qrBase64 = await qrcode.toDataURL(qr)
        
        // Update whatsapp_connections with QR code
        await supabaseClient
          .from('whatsapp_connections')
          .upsert({
            bot_id: botId,
            qr_code: qrBase64,
            qr_code_timestamp: new Date().toISOString(),
            status: 'awaiting_qr'
          })
      }

      if (connection === 'close') {
        await supabaseClient
          .from('whatsapp_connections')
          .update({ 
            status: 'disconnected',
            qr_code: null,
            qr_code_timestamp: null
          })
          .eq('bot_id', botId)
      }

      if (connection === 'open') {
        await supabaseClient
          .from('whatsapp_connections')
          .update({ 
            status: 'connected',
            qr_code: null,
            qr_code_timestamp: null,
            phone_number: sock.user.id.split(':')[0]
          })
          .eq('bot_id', botId)
      }
    })

    return new Response(
      JSON.stringify({ message: 'WhatsApp initialization started' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})