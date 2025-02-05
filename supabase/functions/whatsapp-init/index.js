import { createClient } from '@supabase/supabase-js';
import makeWASocket, { 
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { connectionId } = body;
    
    if (!connectionId) {
      throw new Error('Connection ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Initialize WhatsApp connection
    const logger = P({ level: 'silent' });
    const { version } = await fetchLatestBaileysVersion();
    
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${connectionId}`);
    
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: true,
      browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
    });

    // Handle connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('Connection update:', update);

      if (qr) {
        // Update QR code in database
        await supabase
          .from('whatsapp_connections')
          .update({
            qr_code: qr,
            qr_code_timestamp: new Date().toISOString(),
            status: 'connecting'
          })
          .eq('id', connectionId);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          console.log('Reconnecting...');
        } else {
          console.log('Connection closed. Please scan QR code again.');
          await supabase
            .from('whatsapp_connections')
            .update({
              status: 'disconnected',
              qr_code: null,
              qr_code_timestamp: null
            })
            .eq('id', connectionId);
        }
      } else if (connection === 'open') {
        console.log('Connected successfully!');
        await supabase
          .from('whatsapp_connections')
          .update({
            status: 'connected',
            phone_number: sock.user?.id.split(':')[0],
            qr_code: null,
            qr_code_timestamp: null
          })
          .eq('id', connectionId);
      }
    });

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'WhatsApp initialization started' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};