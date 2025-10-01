// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`analyze-image-for-plastic-bottle function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl, productName } = await req.json(); // Now accepts productName
    let imageToAnalyze: string | null = null;

    if (imageData) {
      imageToAnalyze = imageData; // Base64 from client camera
      console.log("Received base64 image data for analysis (simulated).");
    } else if (imageUrl) {
      console.log(`Received image URL for analysis: ${imageUrl}`);
      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      // Convert ArrayBuffer to base64
      imageToAnalyze = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      console.log("Fetched image from URL and converted to base64.");
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- START: SIMULATED DEEP LEARNING OBJECT DETECTION ---
    // In a real application, you would send `imageToAnalyze` (base64 or URL)
    // to an external AI service (e.g., Google Cloud Vision, AWS Rekognition, custom model API) here.
    // The AI service would return a classification (e.g., "plastic bottle", "glass jar", "aluminum can").

    let isPlasticBottle = false;
    const lowerCaseProductName = (productName || '').toLowerCase();
    console.log(`Simulated AI: Analyzing image with product name context: "${lowerCaseProductName}"`);

    // Heuristics for simulated AI based on product name
    const strongPlasticKeywords = ['plastic bottle', 'bouteille plastique', 'botella de plástico', 'pet bottle', 'hdpe bottle', 'water bottle', 'soda bottle', 'juice bottle', 'shampoo bottle'];
    const strongNonPlasticKeywords = ['glass jar', 'metal can', 'aluminum can', 'verre', 'métal', 'canette', 'boîte de conserve', 'carton'];

    if (strongPlasticKeywords.some(k => lowerCaseProductName.includes(k))) {
      isPlasticBottle = true;
      console.log("Simulated AI: Product name strongly suggests plastic bottle.");
    } else if (strongNonPlasticKeywords.some(k => lowerCaseProductName.includes(k))) {
      isPlasticBottle = false;
      console.log("Simulated AI: Product name strongly suggests non-plastic.");
    } else {
      // If product name is inconclusive, use a biased random chance for the image analysis
      // Assume a slightly higher chance of being plastic if it reached image analysis
      isPlasticBottle = Math.random() > 0.3; // 70% chance of being plastic in ambiguous cases
      console.log(`Simulated AI: Product name inconclusive, using biased random chance. Result: ${isPlasticBottle}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 seconds processing time for AI

    console.log(`Simulated image analysis result: is_plastic_bottle = ${isPlasticBottle}`);
    // --- END: SIMULATED DEEP LEARNING OBJECT DETECTION ---

    return new Response(JSON.stringify({ is_plastic_bottle: isPlasticBottle }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in analyze-image-for-plastic-bottle function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});