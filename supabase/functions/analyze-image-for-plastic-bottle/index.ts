// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { SignJWT } from "https://deno.land/x/jose@v5.2.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare Deno global for TypeScript
declare const Deno: any;

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Function to get an OAuth2 access token using a service account key
async function getGoogleAccessToken(serviceAccountKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // Token valid for 1 hour

  const payload = {
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform", // Scope for Vision API
    aud: serviceAccountKey.token_uri,
    exp: expiry,
    iat: now,
  };

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    new TextEncoder().encode(serviceAccountKey.private_key.replace(/\\n/g, '\n')), // Handle escaped newlines
    { name: "RSASSA-PKCS1-V1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  const response = await fetch(serviceAccountKey.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Google access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  console.log(`analyze-image-for-plastic-bottle function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    let imageToAnalyze: string | null = null;

    if (imageData) {
      imageToAnalyze = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      console.log("Received base64 image data for analysis.");
    } else if (imageUrl) {
      console.log(`Received image URL for analysis: ${imageUrl}`);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageToAnalyze = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      console.log("Fetched image from URL and converted to base64.");
    } else {
      console.error('Error: Image data or image URL is required in request body.');
      return new Response(JSON.stringify({ error: 'Image data or image URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const googleServiceAccountKeyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
    if (!googleServiceAccountKeyJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON is not set in environment variables.');
    }

    const serviceAccountKey: ServiceAccountKey = JSON.parse(googleServiceAccountKeyJson);
    const accessToken = await getGoogleAccessToken(serviceAccountKey);
    console.log("Google access token obtained.");

    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate`;

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
        'Authorization': `Bearer ${accessToken}`, // Use the obtained access token
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