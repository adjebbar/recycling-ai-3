// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

// Helper function to poll for the prediction result (for asynchronous/queued models)
async function pollForPredictionResult(yolov8ApiUrl: string, eventId: string, timeoutMs = 30000, intervalMs = 500) {
  const startTime = Date.now();
  // The endpoint now only uses the eventId (as 'hash')
  const pollEndpoint = `${yolov8ApiUrl}/gradio_api/queue/data?hash=${eventId}`;

  while (Date.now() - startTime < timeoutMs) {
    console.log(`[yolov8-detect-bottle] Polling for result with event_id: ${eventId}`);
    const pollResponse = await fetch(pollEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      throw new Error(`Gradio API error (polling): ${pollResponse.status} - ${errorText}`);
    }

    const pollData = await pollResponse.json();
    console.log("[yolov8-detect-bottle] Raw polling data:", pollData);

    if (pollData.status === 'complete') {
      if (Array.isArray(pollData.data) && pollData.data.length > 0) {
        return pollData.data[0];
      } else {
        throw new Error('Prediction result data is empty or not an array.');
      }
    } else if (pollData.status === 'error') {
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
    let yolov8ApiUrl = Deno.env.get('YOLOV8_API_URL');

    if (!yolov8ApiUrl) {
      throw new Error('YOLOV8_API_URL must be set in environment variables.');
    }
    yolov8ApiUrl = yolov8ApiUrl.endsWith('/') ? yolov8ApiUrl.slice(0, -1) : yolov8ApiUrl;

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

    const predictEndpoint = `${yolov8ApiUrl}/gradio_api/call/predict`;
    console.log(`[yolov8-detect-bottle] Sending initial POST request to Gradio API: ${predictEndpoint}`);
    
    const initialPredictionResponse = await fetch(predictEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [gradioInputData] }),
    });

    if (!initialPredictionResponse.ok) {
      const errorText = await initialPredictionResponse.text();
      throw new Error(`Gradio API error (initial prediction): ${initialPredictionResponse.status} - ${errorText}`);
    }

    const initialPredictionData = await initialPredictionResponse.json();
    console.log("[yolov8-detect-bottle] Raw initial prediction data:", JSON.stringify(initialPredictionData, null, 2));

    let rawPredictionResult;

    // SCENARIO 1: Asynchronous response (with queue) - ONLY CHECK FOR event_id
    if (initialPredictionData.event_id) {
      console.log("[yolov8-detect-bottle] Asynchronous response detected (event_id found). Starting polling.");
      rawPredictionResult = await pollForPredictionResult(yolov8ApiUrl, initialPredictionData.event_id);
    } 
    // SCENARIO 2: Synchronous response (direct result)
    else if (initialPredictionData.data && Array.isArray(initialPredictionData.data) && initialPredictionData.data.length > 0) {
      console.log("[yolov8-detect-bottle] Synchronous response detected. Using direct result.");
      rawPredictionResult = initialPredictionData.data[0];
    } 
    // SCENARIO 3: Unknown response format
    else {
      throw new Error('Unknown Gradio API response format. Could not find event_id for polling or a direct data result.');
    }
    
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