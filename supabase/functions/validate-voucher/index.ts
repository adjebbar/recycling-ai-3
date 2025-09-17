// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Déclare Deno global pour TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`validate-voucher function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voucherToken } = await req.json();
    if (!voucherToken) {
      throw new Error('Voucher token is required');
    }

    const jwtSecret = Deno.env.get('VOUCHER_JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('VOUCHER_JWT_SECRET is not set');
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const payload = await verify(voucherToken, key);
    const voucherId = payload.voucher_id;

    if (!voucherId) {
      throw new Error('Invalid token payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Récupérer le ticket
    const { data: voucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('id, status, amount')
      .eq('id', voucherId)
      .single();

    if (fetchError || !voucher) {
      throw new Error('Voucher not found');
    }

    // 2. Vérifier son statut
    if (voucher.status !== 'active') {
      return new Response(JSON.stringify({ error: `Voucher already ${voucher.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict
      });
    }

    // 3. Mettre à jour le statut
    const { data: updatedVoucher, error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', voucherId)
      .select('id, amount, redeemed_at')
      .single();

    if (updateError) {
      throw new Error(`Failed to update voucher: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, voucher: updatedVoucher }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in validate-voucher function:', error.message);
    const isAuthError = error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('expired');
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: isAuthError ? 401 : 500,
    });
  }
});