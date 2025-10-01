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
    const { imageData, imageUrl } = await req.json(); // productName is no longer used for AI decision
    let imageToAnalyze: string | null = null;

    if (imageData) {
      imageToAnalyze = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      console.log("Received base64 image data for analysis.");
    } else if (imageUrl) {
      console.log(`Received image URL for analysis: ${imageUrl}`);
      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      // Convert ArrayBuffer to base64
      imageToAnalyze = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      console.log("Fetched image from URL and converted to base64.");
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleVisionApiKey) {
      throw new Error('GOOGLE_VISION_API_KEY is not set in environment variables.');
    }

    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`;

    const visionRequestBody = {
      requests: [
        {
          image: {
            content: imageToAnalyze,
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 10,
            },
            {
              type: "OBJECT_LOCALIZATION",
              maxResults: 10,
            },
          ],
        },
      ],
    };

    console.log("Sending request to Google Cloud Vision API...");
    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequestBody),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error(`Google Vision API responded with status: ${visionResponse.status}, body: ${errorText}`);
      throw new Error(`Google Vision API error: ${visionResponse.status} - ${errorText}`);
    }

    const visionData = await visionResponse.json();
    console.log("Google Vision API response received.");

    let isPlasticBottle = false;
    const confidenceThreshold = 0.7; // 70% confidence

    // Check Label Detection results
    if (visionData.responses && visionData.responses[0] && visionData.responses[0].labelAnnotations) {
      const labels = visionData.responses[0].labelAnnotations;
      const plasticLabels = ['plastic bottle', 'bottle', 'plastic', 'pet bottle', 'water bottle', 'soda bottle', 'container', 'recycling'];
      isPlasticBottle = labels.some((label: any) => 
        plasticLabels.includes(label.description.toLowerCase()) && label.score > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Label Detection.");
    }

    // Check Object Localization results (more precise for object detection)
    if (!isPlasticBottle && visionData.responses && visionData.responses[0] && visionData.responses[0].localizedObjectAnnotations) {
      const objects = visionData.responses[0].localizedObjectAnnotations;
      const plasticObjects = ['plastic bottle', 'bottle', 'water bottle', 'soda bottle'];
      isPlasticBottle = objects.some((obj: any) => 
        plasticObjects.includes(obj.name.toLowerCase()) && obj.score > confidenceThreshold
      );
      if (isPlasticBottle) console.log("Plastic bottle identified via Object Localization.");
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