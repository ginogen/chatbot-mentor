import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, addDays, parseISO } from 'https://esm.sh/date-fns@2.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, botId } = await req.json();
    
    if (!message || !botId) {
      throw new Error('Message and botId are required');
    }

    const openAIApiKey = Deno.env.get('OpenAI_API');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching training data and calendar integration for bot:', botId);

    // Get bot training data
    const { data: trainingData, error: trainingError } = await supabase
      .from('bot_training')
      .select('*')
      .eq('bot_id', botId)
      .maybeSingle();

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
      throw new Error(`Failed to fetch bot training data: ${trainingError.message}`);
    }

    // Check if bot has Cal.com integration
    const { data: calIntegration, error: calError } = await supabase
      .from('bot_integrations')
      .select('*')
      .eq('bot_id', botId)
      .eq('service_name', 'cal')
      .maybeSingle();

    if (calError) {
      console.error('Error fetching Cal.com integration:', calError);
    }

    // Get processed training documents
    const { data: documents, error: documentsError } = await supabase
      .from('training_documents')
      .select('*')
      .eq('bot_id', botId)
      .eq('processed_status', 'completed');

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      throw new Error(`Failed to fetch training documents: ${documentsError.message}`);
    }

    let documentContext = '';
    if (documents && documents.length > 0) {
      documentContext = documents
        .filter(doc => doc.content)
        .map(doc => `Content from ${doc.file_name}:\n${doc.content}\n---\n`)
        .join('\n');
    }

    // Add Cal.com context if integration exists
    let calendarContext = '';
    if (calIntegration && calIntegration.status === 'connected' && calIntegration.config?.selected_calendar) {
      calendarContext = `
        You have access to a calendar integration. When users ask about scheduling meetings, appointments, or any kind of scheduling:
        1. Acknowledge that you can help them schedule
        2. If they mention a specific date (like "tomorrow" or "next week"), use that date to check availability
        3. For checking availability, respond with: [CALENDAR_ACTION]check_availability{date}[/CALENDAR_ACTION]
        4. Once they choose a time slot from the available ones, respond with: [CALENDAR_ACTION]schedule{date,time}[/CALENDAR_ACTION]
        
        Important: For dates, understand natural language like:
        - "tomorrow" -> use tomorrow's date
        - "next week" -> use date 7 days from now
        - Specific dates like "February 10th" -> use that exact date
        
        Always confirm the date and time with the user before scheduling.
      `;
    }

    const contextPrompt = trainingData?.context_prompt || 'You are a helpful assistant.';
    const negativePrompt = trainingData?.negative_prompt || '';
    const temperature = trainingData?.temperature || 0.7;

    const systemPrompt = `
      ${contextPrompt}
      ${negativePrompt ? `\nDO NOT: ${negativePrompt}` : ''}
      ${documentContext ? '\nReference the following documents when relevant:\n' + documentContext : ''}
      ${calendarContext}
      Base your responses on the provided context and documents when applicable.
    `.trim();

    console.log('Sending request to OpenAI with system prompt and temperature:', temperature);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: temperature,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Failed to get response from OpenAI: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});