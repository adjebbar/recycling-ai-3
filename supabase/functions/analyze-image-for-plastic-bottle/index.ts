// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

serve(async (req) => {
  console.log(`[analyze-image-for-plastic-bottle] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("[analyze-image-for-plastic-bottle] Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl, productName } = await req.json();
    console.log(`[analyze-image-for-plastic-bottle] Received request: imageData present: ${!!imageData}, imageUrl present: ${!!imageUrl}, productName: ${productName}`);
    
    const roboflowApiKey = Deno.env.get('ROBOFLOW_API_KEY');

    if (!roboflowApiKey) {
      console.error('[analyze-image-for-plastic-bottle] Error: ROBOFLOW_API_KEY is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'ROBOFLOW_API_KEY must be set in environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log(`[analyze-image-for-plastic-bottle] Roboflow API key found: ${roboflowApiKey ? 'YES' : 'NO'}`);

    const roboflowApiUrl = `https://serverless.roboflow.com/detect-bottles?api_key=${roboflowApiKey}`;
    console.log(`[analyze-image-for-plastic-bottle] Constructed Roboflow API URL for POST: ${roboflowApiUrl}`);

    let requestBody: FormData | URLSearchParams;
    let requestHeaders: HeadersInit = {};

    if (imageData) {
      console.log("[analyze-image-for-plastic-bottle] Processing imageData (base64).");
      const byteString = atob(imageData.split(',')[1]);
      const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      requestBody = new FormData();
      requestBody.append("image", blob, "image.jpeg");
      console.log("[analyze-image-for-plastic-bottle] Appended base64 image as Blob to FormData.");
    } else if (imageUrl) {
      console.log(`[analyze-image-for-plastic-bottle] Processing imageUrl: ${imageUrl}`);
      requestBody = new URLSearchParams();
      requestBody.append("image", imageUrl);
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      console.log(`[analyze-image-for-plastic-bottle] Appended image URL to URLSearchParams with Content-Type: application/x-www-form-urlencoded.`);
    } else {
      console.error('[analyze-image-for-plastic-bottle] Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("[analyze-image-for-plastic-bottle] Sending request to Roboflow API...");
    const roboflowResponse = await fetch(roboflowApiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });
    console.log(`[analyze-image-for-plastic-bottle] Roboflow API response status: ${roboflowResponse.status}`);

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error(`[analyze-image-for-plastic-bottle] Roboflow API responded with non-OK status: ${roboflowResponse.status}, body: ${errorText}`);
      throw new Error(`Roboflow API error: ${roboflowResponse.status} - ${errorText}`);
    }

    const roboflowData = await roboflowResponse.json();
    console.log("[analyze-image-for-plastic-bottle] Roboflow API full response (truncated for log):", JSON.stringify(roboflowData, null, 2).substring(0, 500) + "...");

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    if (roboflowData.predictions && Array.isArray(roboflowData.predictions)) {
      isPlasticBottle = roboflowData.predictions.some((prediction: any) =>
        prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("[analyze-image-for-plastic-bottle] Plastic bottle identified via Roboflow predictions.");
    } else if (roboflowData.detections && Array.isArray(roboflowData.detections)) {
      isPlasticBottle = roboflowData.detections.some((detection: any) =>
        detection.class.toLowerCase().includes('plastic bottle') && detection.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("[analyze-image-for-plastic-bottle] Plastic bottle identified via Roboflow detections.");
    } else {
      console.warn("[analyze-image-for-plastic-bottle] Roboflow response did not contain expected 'predictions' or 'detections' structure.");
    }

    console.log(`[analyze-image-for-plastic-bottle] Final image analysis result: is_plastic_bottle = ${isPlasticBottle}`);

    return new Response(JSON.stringify({ is_plastic_bottle: isPlasticBottle }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[analyze-image-for-plastic-bottle] Uncaught error in function: ${error.message}`);
    return new Response(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});