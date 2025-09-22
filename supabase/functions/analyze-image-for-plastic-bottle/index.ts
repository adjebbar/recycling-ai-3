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
    const { imageData } = await req.json(); // Expecting base64 image data
    if (!imageData) {
      console.error('Error: Image data is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Received image data for analysis (simulated).");

    // --- SIMULATED AI IMAGE ANALYSIS ---
    // In a real application, you would send `imageData` to an external AI service here.
    // For example, using Google Cloud Vision API, AWS Rekognition, or a custom ML model.
    // The AI service would return a classification (e.g., 'plastic bottle', 'glass bottle', 'can').

    // For demonstration purposes, we'll simulate a result.
    // Let's assume a simple heuristic for simulation:
    // If the base64 string contains 'plastic' (unlikely in actual image data but for demo)
    // or if we want to randomly succeed/fail for testing.
    const isPlasticBottle = Math.random() > 0.5; // 50% chance of being a plastic bottle for demo

    // You could also add a delay to simulate network latency for AI processing
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