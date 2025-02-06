import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } from '@whiskeysockets/baileys'
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
    const { connectionId } = await req.json()
    if (!connectionId) {
      throw new Error('ConnectionId is required')
    }

    console.log('Initializing WhatsApp connection for:', connectionId)
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get connection details
    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      throw new Error('Connection not found')
    }

    // Initialize session state handlers
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${connectionId}`)
    
    console.log('Creating WhatsApp socket...')
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: Browsers.ubuntu('Chrome'),
      generateHighQualityLinkPreview: true,
      // Configuración específica de la versión de WhatsApp Web
      version: [2, 2414, 7],
      // Timeouts más largos para dar tiempo a escanear
      connectTimeoutMs: 90_000,
      qrTimeout: 60_000,
      defaultQueryTimeoutMs: 90_000,
      // Configuración para mejorar la estabilidad
      retryRequestDelayMs: 250,
      logger: console, // Activamos logging detallado
    })

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      console.log('Connection update:', update)
      
      if (qr) {
        try {
          console.log('New QR code received, generating with WhatsApp Web specs...')
          // Configuración específica para QR de WhatsApp Web
          const qrOptions = {
            margin: 4,
            scale: 6,
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.95,
            width: 512,
          }
          
          const qrBase64 = await qrcode.toDataURL(qr, qrOptions)
          
          // Update whatsapp_connections with QR code
          const { error: updateError } = await supabaseClient
            .from('whatsapp_connections')
            .update({
              qr_code: qrBase64,
              qr_code_timestamp: new Date().toISOString(),
              status: 'connecting'
            })
            .eq('id', connectionId)

          if (updateError) {
            console.error('Error updating QR code:', updateError)
          }
        } catch (error) {
          console.error('Error processing QR code:', error)
        }
      }

      if (connection === 'close') {
        console.log('Connection closed, checking reason...')
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode === DisconnectReason.loggedOut || 
                              statusCode === DisconnectReason.connectionClosed
        
        console.log('Disconnect reason:', { statusCode, shouldReconnect })
        
        await supabaseClient
          .from('whatsapp_connections')
          .update({ 
            status: shouldReconnect ? 'disconnected' : 'error',
            qr_code: null,
            qr_code_timestamp: null
          })
          .eq('id', connectionId)
      }

      if (connection === 'open') {
        console.log('Connection opened successfully!')
        await supabaseClient
          .from('whatsapp_connections')
          .update({ 
            status: 'connected',
            qr_code: null,
            qr_code_timestamp: null,
            phone_number: sock.user?.id?.split(':')[0]
          })
          .eq('id', connectionId)
      }
    })

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds)

    return new Response(
      JSON.stringify({ 
        message: 'WhatsApp initialization started',
        connectionId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in WhatsApp initialization:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})