// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

serve(async (req) => {
  console.log(`analyze-image-for-plastic-bottle function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    let imageToAnalyze: string | null = null;

    if (imageData) {
      imageToAnalyze = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      console.log("Received base64 image data for analysis.");
    } else if (imageUrl) {
      console.log(`Received image URL for analysis: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageToAnalyze = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      console.log("Fetched image from URL and converted to base64.");
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const roboflowApiKey = Deno.env.get('ROBOFLOW_API_KEY');
    const roboflowProjectUrl = Deno.env.get('ROBOFLOW_PROJECT_URL');

    if (!roboflowApiKey || !roboflowProjectUrl) {
      throw new Error('ROBOFLOW_API_KEY and ROBOFLOW_PROJECT_URL must be set in environment variables.');
    }
    console.log("Roboflow API key and project URL found.");

    const roboflowApiUrl = `${roboflowProjectUrl}?api_key=${roboflowApiKey}`;

    console.log("Sending request to Roboflow API...");
    const roboflowResponse = await fetch(roboflowApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: { type: 'base64', value: imageToAnalyze } }),
    });

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error(`Roboflow API responded with status: ${roboflowResponse.status}, body: ${errorText}`);
      throw new Error(`Roboflow API error: ${roboflowResponse.status} - ${errorText}`);
    }

    const roboflowData = await roboflowResponse.json();
    console.log("Roboflow API response received:", JSON.stringify(roboflowData, null, 2));

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    if (roboflowData.predictions && Array.isArray(roboflowData.predictions)) {
      isPlasticBottle = roboflowData.predictions.some((prediction: any) =>
        prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Roboflow predictions.");
    }

    console.log(`Final image analysis result: is_plastic_bottle = ${isPlasticBottle}`);

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