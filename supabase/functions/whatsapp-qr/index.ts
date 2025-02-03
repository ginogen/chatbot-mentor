import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';

let currentQRCode: string | null = null;

serve(async (req) => {
  if (req.method === 'GET') {
    if (!currentQRCode) {
      return new Response(JSON.stringify({ error: 'QR code not available yet' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ qrCode: currentQRCode }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
});