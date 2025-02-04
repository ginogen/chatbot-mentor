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
    const { documentId } = await req.json();
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log('Processing document:', documentId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('training_documents')
      .update({ processed_status: 'processing' })
      .eq('id', documentId);

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from('training_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      throw new Error(`Failed to fetch document: ${fetchError?.message}`);
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('training_docs')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert file to text based on type
    let content = '';
    if (document.file_type === 'text/plain') {
      content = await fileData.text();
    } else if (document.file_type === 'application/pdf') {
      // For now, we'll just convert PDF to text directly
      const text = await fileData.text();
      content = text;
    } else if (document.file_type === 'text/csv') {
      // Handle CSV files by converting them to readable text
      const text = await fileData.text();
      // Process CSV content to make it more readable
      const lines = text.split('\n');
      const processedLines = lines.map(line => {
        // Replace commas with spaces and clean up the line
        return line.replace(/,/g, ' | ').trim();
      });
      content = processedLines.join('\n');
    } else {
      throw new Error(`Unsupported file type: ${document.file_type}`);
    }

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('training_documents')
      .update({
        content,
        processed_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);

    // Update document status to failed if we have a document ID
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('training_documents')
          .update({
            processed_status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq('id', documentId);
      }
    } catch (e) {
      console.error('Failed to update document status:', e);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});