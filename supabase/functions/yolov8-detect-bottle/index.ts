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
    console.log("[yolov8-detect-bottle] Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    console.log(`[yolov8-detect-bottle] Received request: imageData present: ${!!imageData}, imageUrl present: ${!!imageUrl}`);
    
    let yolov8ApiUrl = Deno.env.get('YOLOV8_API_URL');

    if (!yolov8ApiUrl) {
      console.error('[yolov8-detect-bottle] Error: YOLOV8_API_URL is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'YOLOV8_API_URL must be set in environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    // Ensure no trailing slash on the base URL to prevent double slashes when appending paths
    yolov8ApiUrl = yolov8ApiUrl.endsWith('/') ? yolov8ApiUrl.slice(0, -1) : yolov8ApiUrl;
    console.log(`[yolov8-detect-bottle] Normalized YOLOv8 API URL from env: ${yolov8ApiUrl}`);

    let imageSource: string;

    if (imageData) {
      console.log("[yolov8-detect-bottle] Using provided imageData (base64 data URI).");
      imageSource = imageData;
    } else if (imageUrl) {
      console.log(`[yolov8-detect-bottle] Using provided imageUrl: ${imageUrl}`);
      imageSource = imageUrl;
    } else {
      console.error('[yolov8-detect-bottle] Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[yolov8-detect-bottle] Image source (URL or data URI) length: ${imageSource.length}`);

    // Construct the Gradio-specific input data format
    const gradioInputData = {
      path: imageSource,
      meta: { _type: "gradio.FileData" }
    };

    // --- Direct prediction using /gradio_api/call/predict endpoint as per curl command ---
    const predictEndpoint = `${yolov8ApiUrl}/gradio_api/call/predict`; // Corrected endpoint
    console.log(`[yolov8-detect-bottle] Sending POST request to Gradio API endpoint: ${predictEndpoint}`);
    
    const predictionResponse = await fetch(predictEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [gradioInputData] // Send structured image data in the data array
      }),
    });
    console.log(`[yolov8-detect-bottle] Prediction response status: ${predictionResponse.status}`);

    if (!predictionResponse.ok) {
      const errorText = await predictionResponse.text();
      console.error(`[yolov8-detect-bottle] Prediction to Gradio API responded with non-OK status: ${predictionResponse.status}, body: ${errorText}`);
      throw new Error(`Gradio API error (prediction): ${predictionResponse.status} - ${errorText}`);
    }

    const predictionData = await predictionResponse.json();
    console.log("[yolov8-detect-bottle] Raw prediction data:", predictionData);

    // The Gradio API documentation implies the result is directly in data[0]
    // The output is a boolean, so we expect predictionData.data[0] to be the boolean result.
    const isPlasticBottle = typeof predictionData.data[0] === 'boolean' ? predictionData.data[0] : false;
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