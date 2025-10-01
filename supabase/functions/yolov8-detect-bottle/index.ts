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
    const { imageData, imageUrl } = await req.json(); // Removed productName as Gradio API doesn't use it
    console.log(`[yolov8-detect-bottle] Received request: imageData present: ${!!imageData}, imageUrl present: ${!!imageUrl}`);
    
    const yolov8ApiUrl = Deno.env.get('YOLOV8_API_URL');

    if (!yolov8ApiUrl) {
      console.error('[yolov8-detect-bottle] Error: YOLOV8_API_URL is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'YOLOV8_API_URL must be set in environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log(`[yolov8-detect-bottle] YOLOv8 API URL found: ${yolov8ApiUrl}`);

    let base64ImageString: string;

    if (imageData) {
      console.log("[yolov8-detect-bottle] Using provided imageData (base64).");
      base64ImageString = imageData; // imageData is already a data URI
    } else if (imageUrl) {
      console.log(`[yolov8-detect-bottle] Fetching image from imageUrl: ${imageUrl}`);
      
      const imageFetchResponse = await fetch(imageUrl);
      if (!imageFetchResponse.ok) {
        const errorBody = await imageFetchResponse.text();
        console.error(`[yolov8-detect-bottle] Failed to fetch image from URL: ${imageFetchResponse.status} - ${errorBody}`);
        throw new Error(`Failed to fetch image from URL: ${imageFetchResponse.statusText}`);
      }
      const imageBlob = await imageFetchResponse.blob();
      
      // Convert blob to base64 data URI
      const arrayBuffer = await imageBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64ImageString = `data:${imageBlob.type};base64,${btoa(binary)}`;
      console.log(`[yolov8-detect-bottle] Fetched image converted to base64 data URI.`);
    } else {
      console.error('[yolov8-detect-bottle] Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[yolov8-detect-bottle] Base64 image string length: ${base64ImageString.length}`);

    console.log("[yolov8-detect-bottle] Sending request to YOLOv8 API (Hugging Face Gradio)...");
    const yolov8Response = await fetch(yolov8ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [base64ImageString] }), // Gradio API expects JSON with 'data' array
    });
    console.log(`[yolov8-detect-bottle] YOLOv8 API response status: ${yolov8Response.status}`);

    if (!yolov8Response.ok) {
      const errorText = await yolov8Response.text();
      console.error(`[yolov8-detect-bottle] YOLOv8 API responded with non-OK status: ${yolov8Response.status}, body: ${errorText}`);
      throw new Error(`YOLOv8 API error: ${yolov8Response.status} - ${errorText}`);
    }

    const yolov8Data = await yolov8Response.json();
    console.log("[yolov8-detect-bottle] YOLOv8 API full response (truncated for log):", JSON.stringify(yolov8Data, null, 2).substring(0, 500) + "...");

    // Gradio output is [boolean, image_base64_string]
    const isPlasticBottle = yolov8Data.data && typeof yolov8Data.data[0] === 'boolean' ? yolov8Data.data[0] : false;
    
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