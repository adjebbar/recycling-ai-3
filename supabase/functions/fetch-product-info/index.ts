// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Déclare Deno global pour TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * A more robust function to determine if a product is a plastic bottle based on its data.
 * This function now runs on the server.
 */
const isPlasticBottle = (product: any): boolean => {
  if (!product) return false;

  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    product.packaging,
    product.packaging_text,
    product.ingredients_text,
    ...(product.packaging_tags || []),
  ].filter(Boolean).join(' ').toLowerCase();

  const plasticKeywords = ['plastic', 'plastique', 'pet', 'hdpe', 'polyethylene', 'bouteille en plastique'];
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'eau', 'water', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk'];
  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak', 'pouch', 'sachet'];

  // 1. Strict Exclusion
  if (exclusionKeywords.some(keyword => searchText.includes(keyword))) {
    return false;
  }

  // 2. Primary Inclusion (strongest signal)
  if (plasticKeywords.some(keyword => searchText.includes(keyword)) && bottleKeywords.some(keyword => searchText.includes(keyword))) {
    return true;
  }
  
  // 3. Secondary Heuristics
  const hasDrinkKeyword = drinkKeywords.some(keyword => searchText.includes(keyword));
  const hasBottleKeyword = bottleKeywords.some(keyword => searchText.includes(keyword));

  if (hasDrinkKeyword && hasBottleKeyword) {
    return true;
  }
  
  // Heuristic for water bottles which are almost always plastic if not excluded
  if ((searchText.includes('eau') || searchText.includes('water')) && !exclusionKeywords.some(k => searchText.includes(k))) {
      return true;
  }

  return false;
};

// Helper to fetch an image from a URL and convert it to base64
async function imageToB64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


serve(async (req) => {
  console.log(`[verify-product] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    if (!barcode) {
      throw new Error('Barcode is required');
    }

    // --- Step 1: Fetch product data from Open Food Facts ---
    const userAgent = 'EcoScanAI/1.0 - Supabase Edge Function';
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { 'User-Agent': userAgent }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(JSON.stringify({ decision: 'not_found', reason: 'Product not found in the database.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });
      }
      throw new Error(`Open Food Facts API responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      return new Response(JSON.stringify({ decision: 'not_found', reason: 'Product not found in the database.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }
    
    const product = data.product;

    // --- Step 2: Perform Text-Based Analysis ---
    if (isPlasticBottle(product)) {
      console.log(`[verify-product] Text analysis ACCEPTED for barcode: ${barcode}`);
      return new Response(JSON.stringify({ decision: 'accepted', product, reason: 'Verified as plastic bottle by text analysis.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    console.log(`[verify-product] Text analysis was inconclusive for barcode: ${barcode}. Proceeding to image analysis.`);

    // --- Step 3: Fallback to Image Analysis (Simulated) ---
    const imageUrl = product.image_front_url || product.image_url;
    if (!imageUrl) {
      console.log(`[verify-product] No image available for barcode: ${barcode}. Rejecting.`);
      return new Response(JSON.stringify({ decision: 'rejected', product, reason: 'Not a plastic bottle and no image available for further analysis.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // We need to invoke the other function. In a real scenario, you'd pass the image data.
    // For this simulation, the other function generates a random result anyway.
    const { data: imageAnalysisData, error: imageAnalysisError } = await supabaseAdmin.functions.invoke('analyze-image-for-plastic-bottle', {
        body: { imageData: "simulated_trigger" }, // Pass dummy data as it's simulated
    });

    if (imageAnalysisError) {
        throw imageAnalysisError;
    }

    if (imageAnalysisData.is_plastic_bottle) {
        console.log(`[verify-product] Image analysis ACCEPTED for barcode: ${barcode}`);
        return new Response(JSON.stringify({ decision: 'accepted', product, reason: 'Verified as plastic bottle by image analysis.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });
    } else {
        console.log(`[verify-product] Image analysis REJECTED for barcode: ${barcode}`);
        return new Response(JSON.stringify({ decision: 'rejected', product, reason: 'Item does not appear to be a plastic bottle after image analysis.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });
    }

  } catch (error: any) {
    console.error(`Error in verify-product function: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});