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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    
    const roboflowApiKey = Deno.env.get('ROBOFLOW_API_KEY');

    if (!roboflowApiKey) {
      console.error('ROBOFLOW_API_KEY is not set in environment variables.');
      throw new Error('ROBOFLOW_API_KEY must be set in environment variables.');
    }
    console.log(`Roboflow API key found: ${roboflowApiKey ? 'YES' : 'NO'}`);

    const roboflowApiUrl = `https://serverless.roboflow.com/detect-bottles?api_key=${roboflowApiKey}`;
    console.log(`Constructed Roboflow API URL for POST: ${roboflowApiUrl}`);

    let requestBody: FormData | URLSearchParams;
    let requestHeaders: HeadersInit = {};

    if (imageData) {
      // Convert base64 to Blob for multipart/form-data
      const byteString = atob(imageData.split(',')[1]);
      const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      requestBody = new FormData();
      requestBody.append("image", blob, "image.jpeg"); // Append as a file
      console.log("Appended base64 image as Blob to FormData.");
      // Content-Type will be automatically set to multipart/form-data by fetch
    } else if (imageUrl) {
      // Use application/x-www-form-urlencoded for image URLs
      requestBody = new URLSearchParams();
      requestBody.append("image", imageUrl);
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      console.log(`Appended image URL '${imageUrl}' to URLSearchParams with Content-Type: application/x-www-form-urlencoded.`);
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Sending request to Roboflow API...");
    const roboflowResponse = await fetch(roboflowApiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error(`Roboflow API responded with status: ${roboflowResponse.status}, body: ${errorText}`);
      throw new Error(`Roboflow API error: ${roboflowResponse.status} - ${errorText}`);
    }

    const roboflowData = await roboflowResponse.json();
    console.log("Roboflow API full response:", JSON.stringify(roboflowData, null, 2));

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    if (roboflowData.predictions && Array.isArray(roboflowData.predictions)) {
      isPlasticBottle = roboflowData.predictions.some((prediction: any) =>
        prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Roboflow predictions.");
    } else if (roboflowData.detections && Array.isArray(roboflowData.detections)) {
      isPlasticBottle = roboflowData.detections.some((detection: any) =>
        detection.class.toLowerCase().includes('plastic bottle') && detection.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Roboflow detections.");
    } else {
      console.warn("Roboflow response did not contain expected 'predictions' or 'detections' structure.");
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