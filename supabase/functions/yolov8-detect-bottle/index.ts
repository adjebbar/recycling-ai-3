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
    const { imageData, imageUrl, productName } = await req.json();
    console.log(`[yolov8-detect-bottle] Received request: imageData present: ${!!imageData}, imageUrl present: ${!!imageUrl}, productName: ${productName}`);
    
    const yolov8ApiUrl = Deno.env.get('YOLOV8_API_URL');

    if (!yolov8ApiUrl) {
      console.error('[yolov8-detect-bottle] Error: YOLOV8_API_URL is not set in environment variables.');
      return new Response(JSON.stringify({ error: 'YOLOV8_API_URL must be set in environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log(`[yolov8-detect-bottle] YOLOv8 API URL found: ${yolov8ApiUrl}`);

    let requestBody: FormData;

    if (imageData) {
      console.log("[yolov8-detect-bottle] Processing imageData (base64).");
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
      console.log("[yolov8-detect-bottle] Appended base64 image as Blob to FormData.");
    } else if (imageUrl) {
      console.log(`[yolov8-detect-bottle] Processing imageUrl: ${imageUrl}`);
      
      // Fetch the image from the URL
      const imageFetchResponse = await fetch(imageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageFetchResponse.statusText}`);
      }
      const imageBlob = await imageFetchResponse.blob();
      
      requestBody = new FormData();
      requestBody.append("image", imageBlob, "image.jpeg"); // Append the fetched image blob
      console.log(`[yolov8-detect-bottle] Appended fetched image Blob to FormData.`);
    } else {
      console.error('[yolov8-detect-bottle] Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("[yolov8-detect-bottle] Sending request to YOLOv8 API...");
    const yolov8Response = await fetch(yolov8ApiUrl, {
      method: 'POST',
      body: requestBody, // FormData automatically sets Content-Type: multipart/form-data
    });
    console.log(`[yolov8-detect-bottle] YOLOv8 API response status: ${yolov8Response.status}`);

    if (!yolov8Response.ok) {
      const errorText = await yolov8Response.text();
      console.error(`[yolov8-detect-bottle] YOLOv8 API responded with non-OK status: ${yolov8Response.status}, body: ${errorText}`);
      throw new Error(`YOLOv8 API error: ${yolov8Response.status} - ${errorText}`);
    }

    const yolov8Data = await yolov8Response.json();
    console.log("[yolov8-detect-bottle] YOLOv8 API full response (truncated for log):", JSON.stringify(yolov8Data, null, 2).substring(0, 500) + "...");

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    // Assuming the YOLOv8 API returns a structure similar to Roboflow's predictions/detections
    // You might need to adjust this parsing based on your actual YOLOv8 API response format
    if (yolov8Data.predictions && Array.isArray(yolov8Data.predictions)) {
      isPlasticBottle = yolov8Data.predictions.some((prediction: any) =>
        prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("[yolov8-detect-bottle] Plastic bottle identified via YOLOv8 predictions.");
    } else if (yolov8Data.detections && Array.isArray(yolov8Data.detections)) {
      isPlasticBottle = yolov8Data.detections.some((detection: any) =>
        detection.class.toLowerCase().includes('plastic bottle') && detection.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("[yolov8-detect-bottle] Plastic bottle identified via YOLOv8 detections.");
    } else {
      console.warn("[yolov8-detect-bottle] YOLOv8 response did not contain expected 'predictions' or 'detections' structure. Please check your YOLOv8 API response format.");
    }

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