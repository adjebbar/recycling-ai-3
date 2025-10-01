// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

serve(async (req) => {
  console.log(`[yolov8-detect-bottle] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    const yolov8ApiUrl = Deno.env.get('YOLOV8_API_URL');
    const huggingFaceToken = Deno.env.get('HUGGINGFACE_TOKEN');

    if (!yolov8ApiUrl || !huggingFaceToken) {
      throw new Error('YOLOV8_API_URL and HUGGINGFACE_TOKEN must be set in environment variables.');
    }

    let imageSource: string;
    if (imageData) {
      imageSource = imageData;
    } else if (imageUrl) {
      imageSource = imageUrl;
    } else {
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // CORRECTIF : Extraire l'origine (base URL) pour éviter de concaténer les chemins
    const url = new URL(yolov8ApiUrl);
    const baseUrl = url.origin; // ex: "https://djaber2025-yolov8-bottle-detector.hf.space"
    const predictEndpoint = `${baseUrl}/run/predict`;
    
    console.log(`[yolov8-detect-bottle] Sending POST request to Hugging Face API: ${predictEndpoint}`);

    const response = await fetch(predictEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${huggingFaceToken}`,
      },
      body: JSON.stringify({
        data: [imageSource],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("[yolov8-detect-bottle] Raw API response data:", JSON.stringify(responseData, null, 2));

    if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      throw new Error('Invalid response format from Hugging Face API.');
    }

    const rawPredictionResult = responseData.data[0];
    const isPlasticBottle = typeof rawPredictionResult === 'boolean' ? rawPredictionResult : false;
    console.log(`[yolov8-detect-bottle] Final image analysis result: is_plastic_bottle = ${isPlasticBottle}`);

    return new Response(JSON.stringify({ is_plastic_bottle: isPlasticBottle }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[yolov8-detect-bottle] Uncaught error in function: ${error.message}`);
    return new Response(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});