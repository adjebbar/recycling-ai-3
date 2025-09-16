// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { barcode } = await req.json()
    if (!barcode) {
      console.error('Error: Barcode is required in request body.');
      return new Response(JSON.stringify({ error: 'Barcode is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Fetching product info for barcode: ${barcode}`);
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Open Food Facts API responded with status: ${response.status}, body: ${errorText}`);
      throw new Error(`Open Food Facts API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched data for barcode ${barcode}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`Error in fetch-product-info edge function: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})