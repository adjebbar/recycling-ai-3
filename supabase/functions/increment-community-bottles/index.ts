// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase environment variables are not set.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Use an atomic update to increment total_bottles_recycled
    const { data, error: updateError } = await supabaseAdmin
      .from('community_stats')
      .update({ total_bottles_recycled: (current_total_bottles_recycled: number) => current_total_bottles_recycled + 1 })
      .eq('id', 1)
      .select('total_bottles_recycled')
      .single();

    if (updateError) {
      throw new Error(`Failed to update community stats: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, newTotal: data.total_bottles_recycled }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in increment-community-bottles function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});