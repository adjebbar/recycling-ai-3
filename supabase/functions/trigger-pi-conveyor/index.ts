// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`trigger-pi-conveyor function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { result } = await req.json(); // Expecting 'accepted' or 'rejected'
    console.log(`Received result for Pi: ${result}`);

    if (!result || (result !== 'accepted' && result !== 'rejected')) {
      console.error("Invalid result provided. Must be 'accepted' or 'rejected'.");
      return new Response(JSON.stringify({ error: "Invalid result provided. Must be 'accepted' or 'rejected'." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const rpiConveyorApiUrl = Deno.env.get('RPI_CONVEYOR_API_URL');
    
    if (!rpiConveyorApiUrl) {
      console.warn("RPI_CONVEYOR_API_URL environment variable is not set. Skipping communication with Raspberry Pi.");
      return new Response(JSON.stringify({ success: true, message: "Raspberry Pi not configured, skipping conveyor trigger." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Forwarding result to Raspberry Pi at: ${rpiConveyorApiUrl}`);

    // Forward the request to the Raspberry Pi server
    const piResponse = await fetch(rpiConveyorApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result }),
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      console.error(`Raspberry Pi server responded with status: ${piResponse.status}, body: ${errorText}`);
      throw new Error(`Raspberry Pi server error: ${piResponse.status} - ${errorText}`);
    }

    const piData = await piResponse.json();
    console.log("Raspberry Pi response:", piData);

    return new Response(JSON.stringify({ success: true, piResponse: piData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in trigger-pi-conveyor function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});