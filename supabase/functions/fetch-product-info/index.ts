// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`[fetch-product-info] function invoked. Method: ${req.method}`);
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("[fetch-product-info] Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { barcode } = await req.json()
    console.log(`[fetch-product-info] Received barcode: ${barcode}`);
    if (!barcode) {
      console.error('[fetch-product-info] Error: Barcode is required in request body.');
      return new Response(JSON.stringify({ error: 'Barcode is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`[fetch-product-info] Fetching product info from Open Food Facts for barcode: ${barcode}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`[fetch-product-info] Open Food Facts API call timed out for barcode: ${barcode}`);
    }, 10000); // 10 second timeout for external API call

    let response;
    try {
      const userAgent = 'EcoScanAI/1.0 - Supabase Edge Function';
      response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent,
        }
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error(`[fetch-product-info] Network error fetching from Open Food Facts for barcode ${barcode}:`, fetchError);
      return new Response(JSON.stringify({ error: `Network error connecting to product database: ${fetchError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    
    console.log(`[fetch-product-info] Open Food Facts API response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetch-product-info] Open Food Facts API responded with non-OK status: ${response.status}, body: ${errorText}`);
      throw new Error(`Open Food Facts API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[fetch-product-info] Successfully fetched data for barcode ${barcode}. Product status: ${data.status}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(`[fetch-product-info] Uncaught error in function: ${error.message}`);
    return new Response(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})