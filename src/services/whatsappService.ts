import { Client } from 'whatsapp-web.js';
import QRCode from 'qrcode-terminal';

class WhatsAppService {
  private client: Client;
  private qrCode: string = '';
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    this.client = new Client({});
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      QRCode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.connectionStatus = 'connected';
      console.log('Client is ready!');
    });

    this.client.on('disconnected', () => {
      this.connectionStatus = 'disconnected';
    });
  }

  async initialize() {
    this.connectionStatus = 'connecting';
    try {
      await this.client.initialize();
    } catch (error) {
      console.error('Failed to initialize WhatsApp client:', error);
      this.connectionStatus = 'disconnected';
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getQRCode() {
    return this.qrCode;
  }
}

export const whatsappService = new WhatsAppService();