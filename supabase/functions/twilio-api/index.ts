import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppConnection {
  id: string;
  bot_id: string;
  phone_number: string | null;
  status: string;
  twilio_phone_sid: string | null;
  twilio_status: string;
  monthly_cost: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const twilio = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN')
    )

    const { action, connectionId, countryCode } = await req.json()

    switch (action) {
      case 'list-available-numbers': {
        const numbers = await twilio.availablePhoneNumbers(countryCode)
                           .local
                           .list({smsEnabled: true, voiceEnabled: true})
        
        return new Response(
          JSON.stringify({ numbers }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'purchase-number': {
        const { data: connection } = await supabaseClient
          .from('whatsapp_connections')
          .select('*')
          .eq('id', connectionId)
          .single()

        if (!connection) {
          throw new Error('Connection not found')
        }

        const number = await twilio.incomingPhoneNumbers
          .create({ phoneNumber: connection.phone_number })

        await supabaseClient
          .from('whatsapp_connections')
          .update({
            twilio_phone_sid: number.sid,
            twilio_status: 'active',
            status: 'connected'
          })
          .eq('id', connectionId)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})