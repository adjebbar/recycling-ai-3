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

    let gradioInputData: any;

    if (imageData) {
      console.log("[yolov8-detect-bottle] Using provided imageData (base64 data URI) directly in Gradio input.");
      gradioInputData = imageData; // Pass base64 data URI directly
    } else if (imageUrl) {
      console.log(`[yolov8-detect-bottle] Using provided imageUrl: ${imageUrl} with Gradio FileData structure.`);
      gradioInputData = {
        path: imageUrl,
        meta: { _type: "gradio.FileData" }
      };
    } else {
      console.error('[yolov8-detect-bottle] Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // --- Step 1: Initiate prediction and get event_id ---
    const predictEndpoint = `${yolov8ApiUrl}/gradio_api/call/predict`;
    console.log(`[yolov8-detect-bottle] Sending initial POST request to Gradio API endpoint: ${predictEndpoint}`);
    const initialResponse = await fetch(predictEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [gradioInputData] // Use the dynamically formatted input data
      }),
    });
    console.log(`[yolov8-detect-bottle] Initial POST response status: ${initialResponse.status}`);

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error(`[yolov8-detect-bottle] Initial POST to Gradio API responded with non-OK status: ${initialResponse.status}, body: ${errorText}`);
      throw new Error(`Gradio API error (initial POST): ${initialResponse.status} - ${errorText}`);
    }

    const initialData = await initialResponse.json();
    const eventId = initialData.event_id;

    if (!eventId) {
      console.error('[yolov8-detect-bottle] Error: event_id not found in initial Gradio API response:', initialData);
      throw new Error('Failed to get event_id from Gradio API.');
    }
    console.log(`[yolov8-detect-bottle] Received event_id: ${eventId}`);

    // --- Step 2: Poll for the prediction result ---
    const pollEndpoint = `${yolov8ApiUrl}/gradio_api/call/predict/${eventId}`;
    console.log(`[yolov8-detect-bottle] Polling for prediction result using endpoint: ${pollEndpoint}`);
    const pollResponse = await fetch(pollEndpoint);
    console.log(`[yolov8-detect-bottle] Poll GET response status: ${pollResponse.status}`);

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      console.error(`[yolov8-detect-bottle] Poll GET to Gradio API responded with non-OK status: ${pollResponse.status}, body: ${errorText}`);
      throw new Error(`Gradio API error (poll GET): ${pollResponse.status} - ${errorText}`);
    }

    if (!pollResponse.body) {
      throw new Error('Gradio API poll response body is null.');
    }

    const reader = pollResponse.body.getReader();
    const decoder = new TextDecoder();
    let receivedText = '';
    let isPlasticBottle: boolean | null = null;
    const timeout = 30 * 1000; // 30 seconds timeout for polling
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Gradio API polling timed out.');
      }

      const { done, value } = await reader.read();
      if (done) break;

      receivedText += decoder.decode(value, { stream: true });
      const lines = receivedText.split('\n');
      receivedText = lines.pop() || ''; // Keep incomplete last line

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            console.log("[yolov8-detect-bottle] Received Gradio stream message:", json.msg);
            if (json.msg === 'process_completed' && json.output && Array.isArray(json.output.data)) {
              isPlasticBottle = typeof json.output.data[0] === 'boolean' ? json.output.data[0] : false;
              console.log(`[yolov8-detect-bottle] Final image analysis result: is_plastic_bottle = ${isPlasticBottle}`);
              reader.cancel(); // Stop reading the stream
              break;
            }
          } catch (e) {
            console.warn("[yolov8-detect-bottle] Error parsing Gradio stream line:", e);
          }
        }
      }
      if (isPlasticBottle !== null) break; // Exit loop if result found
    }

    if (isPlasticBottle === null) {
      throw new Error('Failed to get plastic bottle detection result from Gradio API.');
    }

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