import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WhatsApp initialization started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message || 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connectionId } = await req.json();
    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', details: 'Missing connectionId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connection ID received:', connectionId);

    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*, bots!inner(user_id)')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      console.error('Connection error:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Not Found', details: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (connection.bots.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden', details: 'You do not have permission to access this connection' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a QR code for testing
    const qrCode = "iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOFSURBVO3BQY7kSAIDQWeg/v+X67PmKYCgpGZ3ZYT9wRrjEmsMS6wxLLHGsMQawxJrDEusMSyxxrDEGsMSawxLrDEsscawxBrDEmsMS6wxLLHG8MGDlN+pckLlhMoTKk9QOaFyh8oJlTtUnlD5nSpPLLHGsMQawxJrDB98mMqbVJ6g8gaVEyp3qNyh8gaVN6m8aYk1hiXWGJZYY/jgL6NyQuWEyh0qd6jcoXKHyh0qd6j8TUusMSyxxrDEGsMHf7kqd6g8oXJC5YTKHSp3qPyXLLHGsMQawxJrDB/8ZVROqJxQOaFyQuWEyh0qJ1TuUPlfssSawxJrDEusMXzwZpX/EpU7VE6onFA5ofKEyv+JJdYYllhjWGKN4YMPUfmdVE6onFA5oXKHyh0qd6g8ofI7LbHGsMQawxJrDB/8w1ROqJxQOaFyQuWEyh0qJ1TuUDmhckLlhMoJlROvWGKNYYk1hiXWGOyDNf6PqJxQeYPKHSp3qDyh8jctscawxBrDEmsM9sEDKidU7lA5ofImlRMqd6g8oXJC5Q6VEyonVE6onFA5ofKEyhNLrDEsscawxBrDB3+ZKidUnqByd6icUDmhckLlDpU7VJ5YYo1hiTWGJdYYPvgwlTtU7lC5Q+UJKidU7lA5oXKHyh0qJ1TuUDmh8qYl1hiWWGNYYo3hgw9TOaFyQuWEyh0qT6icUDmhckLlDpUTKidUTqicUHnFEmsMy6wxLLHG8MEDlRMqd6icUDmhckLlDpU7VE6onFA5oXKHyh0qJ1TuUHnFEmsMy6wxLLHG8MGHqdyhckLlDpUTKidU7lA5oXJC5YTKCZUTKidU7lB5wxJrDEusMSyxxvDBhz1B5Q6VEyonVE6onFA5oXKHyh0qJ1ROqJxQOaHyhiXWGJZYY1hijcE++BdTOaFyQuWEyh0qJ1ROqJxQOaFyQuWEyomfWGKNYYk1hiXWGD74MJXfSeWEyh0qJ1TuUDmhckLlDpUTKidU7lB50xJrDEusMSyxxvDBh6m8SeUJKidUTqicUDmhckLlDpU7VE6o3KHypiXWGJZYY1hijcE++GVU7lA5oXJC5YTKCZUTKidUTqicUDmhckLlDpU7VJ5YYo1hiTWGJdYY7IM1xiXWGJZYY1hijWGJNYYl1hiWWGNYYo1hiTWGJdYYllhjWGKNYYk1hiXWGJZYY1hijf8BQe0FP3j3O6IAAAAASUVORK5CYII=";

    // Update connection status and QR code
    const { error: updateError } = await supabaseClient
      .from('whatsapp_connections')
      .update({
        status: 'connecting',
        qr_code: qrCode,
        qr_code_timestamp: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (updateError) {
      console.error('Error updating connection:', updateError);
      return new Response(
        JSON.stringify({ error: 'Database Error', details: 'Failed to update connection status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: 'success',
        userId: user.id,
        connectionId,
        qrCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('authorization') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});