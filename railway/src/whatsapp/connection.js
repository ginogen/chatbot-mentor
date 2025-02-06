import makeWASocket, { 
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';

const __dirname = dirname(fileURLToPath(import.meta.url));

class WhatsAppConnection {
  constructor(connectionId, supabase, logger) {
    this.connectionId = connectionId;
    this.supabase = supabase;
    this.logger = logger;
    this.sock = null;
    this.qrCode = null;
    this.authPath = join(__dirname, '..', '..', 'auth', connectionId);
  }

  async initialize() {
    try {
      // Create auth folder if it doesn't exist
      await fs.mkdir(this.authPath, { recursive: true });

      // Load auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      // Create WhatsApp socket connection
      this.sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: this.logger
      });

      // Set up event handlers
      this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', this.handleMessage.bind(this));

      // Update connection status in database
      await this.updateConnectionStatus('connecting');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize WhatsApp connection');
      throw error;
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Generate QR code as base64 image
      const qrCode = await QRCode.toDataURL(qr);
      
      // Update QR code in database
      await this.supabase
        .from('whatsapp_connections')
        .update({ 
          qr_code: qrCode,
          qr_code_timestamp: new Date().toISOString()
        })
        .eq('id', this.connectionId);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        await this.initialize();
      } else {
        await this.updateConnectionStatus('disconnected');
      }
    } else if (connection === 'open') {
      await this.updateConnectionStatus('connected');
    }
  }

  async handleMessage(msg) {
    try {
      const message = msg.messages[0];
      
      if (message.key.fromMe) return;

      // Get conversation for this contact
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('user_identifier', message.key.remoteJid)
        .single();

      // Store message in database
      await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: message.message?.conversation || '',
          role: 'user',
          whatsapp_message_id: message.key.id,
          message_type: 'text',
          status: 'received'
        });
    } catch (error) {
      this.logger.error(error, 'Failed to handle incoming message');
    }
  }

  async updateConnectionStatus(status) {
    try {
      await this.supabase
        .from('whatsapp_connections')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.connectionId);
    } catch (error) {
      this.logger.error(error, 'Failed to update connection status');
    }
  }
}

export default WhatsAppConnection;