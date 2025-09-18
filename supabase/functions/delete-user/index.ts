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
  console.log(`[delete-user] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("[delete-user] Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    console.log(`[delete-user] Attempting to delete user with ID: ${userId}`);

    if (!userId) {
      console.error('[delete-user] Error: User ID is required in request body.');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[delete-user] Error: Supabase environment variables (URL or Service Role Key) are not set.");
      throw new Error("Supabase environment variables are not set.");
    }
    console.log("[delete-user] Supabase URL and Service Role Key found.");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    console.log("[delete-user] Supabase admin client created.");

    // Delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`[delete-user] Error deleting user ${userId}: ${deleteError.message}`);
      return new Response(JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[delete-user] User ${userId} deleted successfully.`);
    return new Response(JSON.stringify({ success: true, message: `User ${userId} deleted successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[delete-user] Uncaught error in function: ${error.message}`);
    return new Response(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});