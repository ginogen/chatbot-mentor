import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, botId } = await req.json();
    
    if (!message || !botId) {
      throw new Error('Message and botId are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get bot training data
    const { data: trainingData, error: trainingError } = await supabase
      .from('bot_training')
      .select('*')
      .eq('bot_id', botId)
      .single();

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
      throw new Error('Failed to fetch bot training data');
    }

    // Get training documents
    const { data: documents, error: documentsError } = await supabase
      .from('training_documents')
      .select('*')
      .eq('bot_id', botId);

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      throw new Error('Failed to fetch training documents');
    }

    const systemPrompt = `
      ${trainingData?.context_prompt || 'You are a helpful assistant.'}
      ${trainingData?.negative_prompt ? `\nDO NOT: ${trainingData.negative_prompt}` : ''}
      ${documents?.length ? '\nReference documents available: ' + documents.map(d => d.file_name).join(', ') : ''}
    `.trim();

    console.log('Sending request to OpenAI with system prompt:', systemPrompt);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to get response from OpenAI');
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