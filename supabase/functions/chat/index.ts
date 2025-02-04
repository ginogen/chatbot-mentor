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

    // Get OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OpenAI_API');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching training data for bot:', botId);

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

    // Prepare document content for context
    let documentContext = '';
    if (documents && documents.length > 0) {
      documentContext = documents
        .filter(doc => doc.content)
        .map(doc => `Content from ${doc.file_name}:\n${doc.content}\n---\n`)
        .join('\n');
    }

    // Use default prompts if no training data exists
    const contextPrompt = trainingData?.context_prompt || 'You are a helpful assistant.';
    const negativePrompt = trainingData?.negative_prompt || '';
    const temperature = trainingData?.temperature || 0.7;

    const systemPrompt = `
      ${contextPrompt}
      ${negativePrompt ? `\nDO NOT: ${negativePrompt}` : ''}
      ${documentContext ? '\nReference the following documents when relevant:\n' + documentContext : ''}
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
        model: 'gpt-4o-mini',
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