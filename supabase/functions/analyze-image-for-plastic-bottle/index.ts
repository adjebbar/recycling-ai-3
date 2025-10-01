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
    console.log("Responding to OPTIONS request.");
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
    const roboflowWorkflowId = Deno.env.get('ROBOFLOW_WORKFLOW_ID'); 

    if (!roboflowApiKey || !roboflowWorkflowId) {
      console.error('ROBOFLOW_API_KEY or ROBOFLOW_WORKFLOW_ID is not set in environment variables.');
      throw new Error('ROBOFLOW_API_KEY and ROBOFLOW_WORKFLOW_ID must be set in environment variables.');
    }
    console.log(`Roboflow API key found: ${roboflowApiKey ? 'YES' : 'NO'}`);
    console.log(`Roboflow Workflow ID from env: ${roboflowWorkflowId}`);

    // The Roboflow Workflow API endpoint is https://api.roboflow.com/workflow/{workflow_id}
    const roboflowApiUrl = `https://api.roboflow.com/workflow/${roboflowWorkflowId}?api_key=${roboflowApiKey}`;
    console.log(`Constructed Roboflow API URL for POST: ${roboflowApiUrl}`);

    const requestBody = JSON.stringify({
      image: {
        type: imageType,
        value: imageToAnalyze,
      },
    });
    console.log("Roboflow Request Body (first 200 chars):", requestBody.substring(0, 200));


    console.log("Sending request to Roboflow Workflow API...");
    const roboflowResponse = await fetch(roboflowApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (!roboflowResponse.ok) {
      const errorText = await roboflowResponse.text();
      console.error(`Roboflow Workflow API responded with status: ${roboflowResponse.status}, body: ${errorText}`);
      throw new Error(`Roboflow Workflow API error: ${roboflowResponse.status} - ${errorText}`);
    }

    const roboflowData = await roboflowResponse.json();
    // Log the entire Roboflow response for debugging
    console.log("Roboflow Workflow API full response:", JSON.stringify(roboflowData, null, 2));

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    // Check for predictions in the workflow_steps or directly in results.predictions
    if (roboflowData.results && roboflowData.results.predictions && Array.isArray(roboflowData.results.predictions)) {
      isPlasticBottle = roboflowData.results.predictions.some((prediction: any) =>
        prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Roboflow workflow predictions.");
    } else if (roboflowData.results && roboflowData.results.workflow_steps && Array.isArray(roboflowData.results.workflow_steps)) {
      for (const step of roboflowData.results.workflow_steps) {
        if (step.predictions && Array.isArray(step.predictions)) {
          const foundInStep = step.predictions.some((prediction: any) =>
            prediction.class.toLowerCase().includes('plastic bottle') && prediction.confidence > confidenceThreshold
          );
          if (foundInStep) {
            isPlasticBottle = true;
            console.log(`Plastic bottle identified in workflow step: ${step.type} via Roboflow workflow predictions.`);
            break;
          }
        }
      }
    } else {
      console.warn("Roboflow workflow response did not contain expected 'results.predictions' or 'results.workflow_steps' structure.");
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