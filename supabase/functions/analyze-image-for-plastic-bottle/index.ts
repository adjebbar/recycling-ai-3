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
    let imageToAnalyze: string | null = null;
    let imageType: 'base64' | 'url';

    if (imageData) {
      imageToAnalyze = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      imageType = 'base64';
      console.log("Received base64 image data for analysis.");
    } else if (imageUrl) {
      imageToAnalyze = imageUrl;
      imageType = 'url';
      console.log(`Received image URL for analysis: ${imageUrl}`);
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const roboflowApiKey = Deno.env.get('ROBOFLOW_API_KEY');

    if (!roboflowApiKey) {
      console.error('ROBOFLOW_API_KEY is not set in environment variables.');
      throw new Error('ROBOFLOW_API_KEY must be set in environment variables.');
    }
    console.log(`Roboflow API key found: ${roboflowApiKey ? 'YES' : 'NO'}`);

    // Use the specific endpoint for the 'detect-bottles' workflow
    const roboflowApiUrl = `https://serverless.roboflow.com/detect-bottles?api_key=${roboflowApiKey}`;
    console.log(`Constructed Roboflow API URL for POST: ${roboflowApiUrl}`);

    const requestBody = JSON.stringify({
      image: {
        type: imageType,
        value: imageToAnalyze,
      },
    });
    console.log("Roboflow Request Body (first 200 chars):", requestBody.substring(0, 200));


    console.log("Sending request to Roboflow API...");
    const roboflowResponse = await fetch(roboflowApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Keep Content-Type as application/json for base64/URL
      },
      body: requestBody,
    });

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error(`Roboflow API responded with status: ${roboflowResponse.status}, body: ${errorText}`);
      throw new Error(`Roboflow API error: ${roboflowResponse.status} - ${errorText}`);
    }

    const roboflowData = await roboflowResponse.json();
    // Log the entire Roboflow response for debugging
    console.log("Roboflow API full response:", JSON.stringify(roboflowData, null, 2));

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    // The response structure for this endpoint might be different.
    // Assuming it returns a 'predictions' array directly in the root or a 'detections' array.
    // We'll check for common object detection output formats.
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