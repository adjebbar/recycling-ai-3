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

    // Étape 1 : Construire l'URL de manière fiable à partir de la base
    const url = new URL(yolov8ApiUrl);
    const baseUrl = url.origin; // Assure que nous n'utilisons que la partie principale de l'URL
    const predictEndpoint = `${baseUrl}/run/predict`; // Utilise le point d'accès standard
    
    console.log(`[yolov8-detect-bottle] Sending POST request to Hugging Face API: ${predictEndpoint}`);

    // Étape 2 : Envoyer la requête avec le format de payload correct
    const response = await fetch(predictEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${huggingFaceToken}`,
      },
      body: JSON.stringify({
        data: [imageSource], // Le format standard pour Gradio
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("[yolov8-detect-bottle] Raw API response data:", JSON.stringify(responseData, null, 2));

    // Étape 3 : Traiter la réponse
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