import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { Client } from 'npm:whatsapp-web.js';
import qrcode from 'npm:qrcode-terminal';

let whatsappClient: Client | null = null;
let currentQRCode: string | null = null;

serve(async (req) => {
  if (req.method === 'POST') {
    try {
      if (!whatsappClient) {
        whatsappClient = new Client({});
        
        whatsappClient.on('qr', (qr) => {
          currentQRCode = qr;
          qrcode.generate(qr, { small: true });
        });

        whatsappClient.on('ready', () => {
          console.log('Client is ready!');
        });

        await whatsappClient.initialize();
      }

      return new Response(JSON.stringify({ status: 'initializing' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});