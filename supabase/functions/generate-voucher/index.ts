// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Declare Deno global for TypeScript
declare const Deno: any;

const VIRTUAL_CASH_PER_POINT = 0.01;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { points } = await req.json();
    if (!points || typeof points !== 'number' || points <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid points provided' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const amount = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);

    // 1. Create a voucher record in the database
    const { data: voucher, error: dbError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        points_cost: points,
        amount: parseFloat(amount),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error creating voucher:', dbError);
      throw new Error('Could not create voucher record.');
    }

    // 2. Create a signed JWT for the voucher
    const jwtSecret = Deno.env.get('VOUCHER_JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('VOUCHER_JWT_SECRET is not set in environment variables.');
    }
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const payload = {
      voucher_id: voucher.id,
      amount: amount,
      iat: Math.floor(Date.now() / 1000),
    };

    const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    return new Response(JSON.stringify({ voucherToken: jwt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-voucher function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});