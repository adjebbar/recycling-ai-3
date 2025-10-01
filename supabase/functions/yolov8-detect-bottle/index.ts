// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

// Helper function to poll for the prediction result
async function pollForPredictionResult(yolov8ApiUrl: string, eventId: string, timeoutMs = 30000, intervalMs = 500) {
  const startTime = Date.now();
  // Changed to GET with query parameter for hash
  const pollEndpoint = `${yolov8ApiUrl}/gradio_api/queue/data?hash=${eventId}`; 

  while (Date.now() - startTime < timeoutMs) { // Corrected Date.Now() to Date.now()
    console.log(`[yolov8-detect-bottle] Polling for result with event_id: ${eventId} at ${pollEndpoint}`);
    const pollResponse = await fetch(pollEndpoint, {
      method: 'GET', // Changed to GET
      headers: {
        'Content-Type': 'application/json', // Still good practice
      },
      // No body for GET request
    });

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      throw new Error(`Gradio API error (polling): ${pollResponse.status} - ${errorText}`);
    }

    const pollData = await pollResponse.json();
    console.log("[yolov8-detect-bottle] Raw polling data:", pollData);

    // Check for 'complete' status (lowercase)
    if (pollData.status === 'complete') { 
      if (Array.isArray(pollData.data) && pollData.data.length > 0) {
        return pollData.data[0];
      } else {
        throw new Error('Prediction result data is empty or not an array.');
      }
    } else if (pollData.status === 'error') { // Check for 'error' status (lowercase)
      throw new Error(`Gradio API prediction error: ${pollData.message || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Prediction polling timed out.');
}

serve(async (req) => {
  console.log(`[yolov8-detect-bottle] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
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
    yolov8ApiUrl = yolov8ApiUrl.endsWith('/') ? yolov8ApiUrl.slice(0, -1) : yolov8ApiUrl;
    console.log(`[yolov8-detect-bottle] Normalized YOLOv8 API URL from env: ${yolov8ApiUrl}`);

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

    const gradioInputData = {
      path: imageSource,
      meta: { _type: "gradio.FileData" }
    };

    // 1. Send initial prediction request to get event_id
    const predictEndpoint = `${yolov8ApiUrl}/gradio_api/call/predict`;
    console.log(`[yolov8-detect-bottle] Sending initial POST request to Gradio API endpoint: ${predictEndpoint}`);
    
    const initialPredictionResponse = await fetch(predictEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [gradioInputData]
      }),
    });
    console.log(`[yolov8-detect-bottle] Initial prediction response status: ${initialPredictionResponse.status}`);

    if (!initialPredictionResponse.ok) {
      const errorText = await initialPredictionResponse.text();
      console.error(`[yolov8-detect-bottle] Initial prediction to Gradio API responded with non-OK status: ${initialPredictionResponse.status}, body: ${errorText}`);
      throw new Error(`Gradio API error (initial prediction): ${initialPredictionResponse.status} - ${errorText}`);
    }

    const initialPredictionData = await initialPredictionResponse.json();
    console.log("[yolov8-detect-bottle] Raw initial prediction data:", initialPredictionData);

    const eventId = initialPredictionData.event_id;
    if (!eventId) {
      throw new Error('Failed to get event_id from initial prediction response.');
    }
    console.log(`[yolov8-detect-bottle] Received event_id: ${eventId}`);

    // 2. Poll for the prediction result using the event_id
    const rawPredictionResult = await pollForPredictionResult(yolov8ApiUrl, eventId);
    
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