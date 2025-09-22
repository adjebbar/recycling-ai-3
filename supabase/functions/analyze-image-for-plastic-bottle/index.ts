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
    const { imageData, imageUrl } = await req.json(); // Now accepts imageUrl
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

    // --- SIMULATED AI IMAGE ANALYSIS ---
    // In a real application, you would send `imageToAnalyze` to an external AI service here.
    // For demonstration purposes, we'll simulate a result.
    const isPlasticBottle = Math.random() > 0.5; // 50% chance of being a plastic bottle for demo

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5 seconds processing

    console.log(`Simulated image analysis result: is_plastic_bottle = ${isPlasticBottle}`);

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